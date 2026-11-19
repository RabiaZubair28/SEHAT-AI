import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, DeepPartial } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/entities/user.entity';
import { UserPersonalInfo } from 'src/user-personal-info/entities/user-personal-info.entity';
import { CreateAdminDto } from './dto/create-admin.dto';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';
import { ApiResponseMessages } from 'src/common/api-messages.constants';
import { ApiSuccessResponseMessages } from 'src/common/api-success-messages.constant';
import { successResponse } from 'src/common/utils/response.util';
import { SocketGateway } from 'src/socket/socket.gateway';
import { RoleName } from 'src/common/enums/enums';
import { Role } from 'src/roles/entities/role.entity';
import { PASSWORD_SALT_ROUNDS } from 'src/common/app.constants';
import { RedisCacheService } from 'src/common/cache/redis-cache.service';
import { buildAuthGuardUserCachePrefix } from 'src/auth/auth-user-query.util';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserPersonalInfo)
    private readonly personalInfoRepository: Repository<UserPersonalInfo>,
    private readonly dataSource: DataSource,
    private readonly socketGateway: SocketGateway,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  async create(createAdminDto: CreateAdminDto) {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createAdminDto.email },
    });

    if (existingUser) {
      throw new ConflictException(ApiResponseMessages.EMAIL_EXISTS);
    }

    // Check if trying to create a facility incharge for a facility that already has one
    if (createAdminDto.role_id && createAdminDto.facility_id) {
      const role = await this.roleRepository.findOne({
        where: { id: Number(createAdminDto.role_id) },
      });

      if (role && role.name === RoleName.FACILITY_INCHARGE) {
        const existingIncharge = await this.userRepository.findOne({
          where: {
            facility: { id: Number(createAdminDto.facility_id) },
            role: { name: RoleName.FACILITY_INCHARGE },
          },
          relations: ['role', 'facility'],
        });

        if (existingIncharge) {
          throw new ConflictException(
            `${ApiResponseMessages.FACILITY_INCHARGE_EXISTS} `,
          );
        }
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const {
        role_id,
        facility_id,
        district_id,
        division_id,
        uc_id,
        taluka_id,
        password,
        cnic,
        dob,
        gender,
        contact,
        address,
        qualifications,
        specialization,
        emergency_contact,
        blood_type,
        marital_status,
        nationality,
        religion,
        ...userData
      } = createAdminDto;

      // Hash password
      const hashedPassword = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

      // Create user with all fields
      const user = this.userRepository.create({
        ...userData,
        password: hashedPassword,
        role: role_id ? { id: Number(role_id) } : null,
        facility: facility_id ? { id: Number(facility_id) } : null,
        district_id,
        division_id,
        uc_id,
        taluka_id,
      } as DeepPartial<User>);

      const savedUser = await queryRunner.manager.save(User, user);

      // Create personal info if any personal data provided
      const personalInfoData = {
        cnic,
        dob,
        gender,
        contact,
        address,
        qualifications,
        specialization,
        emergency_contact,
        blood_type,
        marital_status,
        nationality,
        religion,
      };

      // Only create personal info if at least one field is provided
      const hasPersonalInfo = Object.values(personalInfoData).some(
        (val) => val !== undefined,
      );

      if (hasPersonalInfo) {
        const personalInfo = this.personalInfoRepository.create({
          ...personalInfoData,
          user: savedUser,
        } as DeepPartial<UserPersonalInfo>); // Add this cast
        await queryRunner.manager.save(UserPersonalInfo, personalInfo);
      }

      await queryRunner.commitTransaction();

      // Emit socket event to admin roles
      this.socketGateway.emitToRoles(
        [RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.FACILITY_INCHARGE],
        'user_created',
        successResponse(savedUser, 'User created successfully by admin', 201),
      );

      return successResponse(savedUser, 'User created successfully', 201);
    } catch (e) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`User creation failed: ${e.message}`);
      throw new InternalServerErrorException(
        'User creation failed. Please try again.',
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Sets a temporary password for a user who cannot use the email reset flow
   * (e.g. facility incharges with placeholder emails). The user's session is
   * ended and they must choose a new password at next login.
   */
  async resetUserPassword(
    currentUser: AuthenticatedUser,
    targetUserId: number,
    dto: AdminResetPasswordDto,
  ) {
    if (currentUser.role !== RoleName.SUPER_ADMIN) {
      throw new ForbiddenException(
        ApiResponseMessages.ONLY_SUPER_ADMIN_CAN_RESET_PASSWORD,
      );
    }

    if (Number(currentUser.sub) === targetUserId) {
      throw new BadRequestException(
        ApiResponseMessages.CANNOT_RESET_OWN_PASSWORD,
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: targetUserId },
      relations: ['role'],
      loadEagerRelations: false,
    });

    if (!user) {
      throw new NotFoundException(ApiResponseMessages.USER_NOT_FOUND);
    }

    if (user.role?.name === RoleName.SUPER_ADMIN) {
      throw new ForbiddenException(
        ApiResponseMessages.CANNOT_RESET_SUPER_ADMIN_PASSWORD,
      );
    }

    try {
      await this.userRepository.update(user.id, {
        password: await bcrypt.hash(dto.new_password, PASSWORD_SALT_ROUNDS),
        must_change_password: true,
        access_token: null,
      });
      await this.redisCacheService.deleteByPrefix(
        buildAuthGuardUserCachePrefix(user.id),
      );
    } catch (e) {
      this.logger.error(
        `${ApiResponseMessages.ADMIN_RESET_PASSWORD_FAILED}: ${e.message}`,
        e.stack,
      );
      throw new InternalServerErrorException(
        ApiResponseMessages.ADMIN_RESET_PASSWORD_FAILED,
      );
    }

    this.logger.log(
      `Password reset by super admin (actorUserId=${currentUser.sub}, targetUserId=${user.id})`,
    );

    return successResponse(
      { id: user.id, must_change_password: true },
      ApiSuccessResponseMessages.PASSWORD_RESET_BY_ADMIN_SUCCESSFULLY,
      200,
    );
  }
}
