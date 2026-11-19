import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, In, ILike, Not } from 'typeorm';
import { UserService } from './entities/user-service.entity';
import { CreateUserServiceDto } from './dto/create-user-service.dto';
import { User } from 'src/users/entities/user.entity';
import { Service } from 'src/services/entities/service.entity';
import { UserServiceSearchDto } from './dto/search-user-service.dto';
import { successResponse } from 'src/common/utils/response.util';
import { SocketGateway } from 'src/socket/socket.gateway';
import { Appointment } from 'src/appointments/entities/appointment.entity';
import {
  Gender,
  PatientStatus,
  RoleName,
  ServiceType,
  UserStatus,
} from 'src/common/enums/enums';
import { ApiResponseMessages } from 'src/common/api-messages.constants';
import { ExceptionUtility } from 'src/common/utils/helper.util';

@Injectable()
export class UserServicesService {
  private readonly logger: Logger = new Logger(UserServicesService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,

    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly socketGateway: SocketGateway,
  ) {}

  private getAllowedServiceTypesByRole(roleName?: RoleName): ServiceType[] {
    switch (roleName) {
      case RoleName.MEDICAL_OFFICER_MALE:
        return [
          ServiceType.OPD,
          ServiceType.NUTRITION,
        ];
      case RoleName.MEDICAL_OFFICER_FEMALE:
      case RoleName.SBA:
        return [
          ServiceType.OPD,
          ServiceType.ANC,
          ServiceType.DELIVERY,
          ServiceType.PNC,
          ServiceType.FAMILY_PLANNING,
          ServiceType.NUTRITION,
          ServiceType.IMMUNISATION,
        ];
      case RoleName.VACCINATOR:
        return [ServiceType.IMMUNISATION];
      case RoleName.DISPENSER:
        return [ServiceType.MEDICINE_DISPENSING];
      case RoleName.PAEDS:
        return [ServiceType.OPD];
      default:
        return [];
    }
  }

  private validateAllowedServicesForRole(
    roleName: RoleName | undefined,
    services: Service[],
  ) {
    const allowedServices = this.getAllowedServiceTypesByRole(roleName);

    if (allowedServices.length === 0) {
      throw new ForbiddenException(
        `Users with role ${roleName ?? 'unknown'} cannot be assigned services.`,
      );
    }

    const disallowedServices = services.filter(
      (service) => !allowedServices.includes(service.name as ServiceType),
    );

    if (disallowedServices.length > 0) {
      throw new ForbiddenException(
        `Role ${roleName} can only be assigned these services: ${allowedServices.join(', ')}.`,
      );
    }
  }

  async getServicesByRole(roleName: RoleName) {
    try {
      const allowedServices = this.getAllowedServiceTypesByRole(roleName);
      const data =
        allowedServices.length === 0
          ? []
          : await this.serviceRepository.find({
              where: { name: In(allowedServices) },
              order: { id: 'ASC' },
            });

      return successResponse(data, 'Services fetched successfully');
    } catch (error) {
      this.logger.error(ApiResponseMessages.FET_USER_FAILED, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.FET_USER_FAILED,
      );
    }
  }

  async create(
    activeFacilityId: number,
    activeUserId: number,
    dto: CreateUserServiceDto,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { id: dto.user_id, status: UserStatus.APPROVED },
        relations: ['facility', 'services', 'personalInfo', 'role'],
      });

      if (!user)
        throw new NotFoundException(`User with ID ${dto.user_id} not found`);

      const activeUser = await queryRunner.manager.findOne(User, {
        where: { id: activeUserId },
        relations: ['role'],
      });

      const bypassValidations = activeUser?.role?.name
        ? [RoleName.SUPER_ADMIN, RoleName.ADMIN].includes(activeUser.role.name)
        : false;

      if (!bypassValidations && user.facility.id !== activeFacilityId) {
        throw new NotFoundException(
          `User with ID ${dto.user_id} does not belong to the active facility`,
        );
      }

      if (!bypassValidations && activeUserId === dto.user_id) {
        throw new ForbiddenException('You cannot assign services to yourself');
      }

      const services = await queryRunner.manager.find(Service, {
        where: { id: In(dto.services_ids) },
      });

      if (services.length !== dto.services_ids.length) {
        throw new NotFoundException('One or more service IDs are invalid');
      }

      this.validateAllowedServicesForRole(user.role?.name, services);

      if (!bypassValidations) {
        const availableServiceIds = await queryRunner.manager
          .find(UserService, {
            where: {
              userId: dto.user_id,
            },
          })
          .then((userServices) => userServices.map((us) => us.serviceId));
        const removedServiceIds = availableServiceIds.filter(
          (id) => !dto.services_ids.includes(id),
        );
        if (removedServiceIds.length > 0) {
          const inProgressAppointment = await queryRunner.manager.findOne(
            Appointment,
            {
              where: {
                doctor: { id: dto.user_id },
                status: PatientStatus.IN_PROGRESS,
                appointmentServices: {
                  status: PatientStatus.IN_PROGRESS,
                  service: { id: In(removedServiceIds) },
                },
              },
            },
          );
          if (inProgressAppointment) {
            throw new NotFoundException(
              'Cannot remove services that are currently in progress for the doctor. Please complete the appointment before removing the service.'
            );
          }
        }
      }

      if (
        services.some((service) =>
          [ServiceType.ANC, ServiceType.DELIVERY].includes(
            service.name as ServiceType,
          ),
        ) &&
        user.personalInfo?.gender !== Gender.FEMALE
      ) {
        throw new ForbiddenException(
          'Services ANC and DELIVERY can only be assigned to a female user',
        );
      }

      const existingUserServices = await queryRunner.manager.find(UserService, {
        where: {
          user: { id: dto.user_id },
        },
      });

      let userServices: UserService[];
      if (existingUserServices.length > 0) {
        await queryRunner.manager.delete(UserService, {
          user: { id: dto.user_id },
        });
        userServices = services.map((service) =>
          queryRunner.manager.create(UserService, {
            user,
            service,
            createdBy: { id: activeUserId },
            updatedBy: { id: activeUserId },
          }),
        );
      } else {
        userServices = services.map((service) =>
          queryRunner.manager.create(UserService, {
            user,
            service,
            createdBy: { id: activeUserId },
          }),
        );
      }

      const saved = await queryRunner.manager.save(UserService, userServices);
      await queryRunner.commitTransaction();

      const updatedUser = await this.userRepository.findOne({
        where: { id: dto.user_id },
        relations: [
          'userPermissions',
          'userPermissions.permission',
          'role',
          'facility',
          'services',
        ],
      });

      this.socketGateway.emitToUser(dto.user_id, 'user_updated', {
        user: updatedUser,
      });

      return successResponse(saved, 'User service created successfully', 201);
    } catch (error) {
      this.logger.error(ApiResponseMessages.U_SERV_ASSIGN_FAILED, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.U_SERV_ASSIGN_FAILED,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(facilityId: number | undefined, filters: UserServiceSearchDto) {
    try {
      const whereConditions: any = {
        status: In([UserStatus.APPROVED]),
        facility: { id: facilityId },
        role: {
          name: Not(
            In([
              RoleName.REGISTRATION_CLERK,
              RoleName.FACILITY_INCHARGE,
              RoleName.SUPER_ADMIN,
              RoleName.ADMIN,
              RoleName.HEAD_OFFICE,
              RoleName.TELEHEALTH_CONSULTANT,
            ]),
          ),
        },
      };

      if (filters.first_name) {
        whereConditions.first_name = ILike(`%${filters.first_name}%`);
      }

      if (filters.last_name) {
        whereConditions.last_name = ILike(`%${filters.last_name}%`);
      }

      if (filters.email) {
        whereConditions.email = ILike(`%${filters.email}%`);
      }

      const [data, count] = await this.userRepository.findAndCount({
        where: whereConditions,
        relations: ['role', 'facility', 'services'],
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          status: true,
          role: {
            id: true,
            name: true,
          },
          facility: {
            id: true,
            name: true,
          },
          services: {
            id: true,
            name: true,
          },
        },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      });

      const message =
        count === 0 ? 'No Data Found' : 'Users fetched successfully';

      return successResponse(
        data,
        message,
        200,
        filters.page,
        filters.limit,
        count,
      );
    } catch (error) {
      this.logger.error(ApiResponseMessages.FET_USER_FAILED, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.FET_USER_FAILED,
      );
    }
  }
}
