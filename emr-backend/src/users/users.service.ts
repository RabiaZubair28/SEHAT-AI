import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserSearchDto } from './dto/search-user.dto';
import { errorResponse, successResponse } from 'src/common/utils/response.util';
import { Permission } from 'src/permissions/entities/permission.entity';
import { UserPermission } from '../user-permissions/entities/user-permission.entity';
import { Role } from 'src/roles/entities/role.entity';
import { RolePermission } from 'src/role-permisssions/entities/role-permisssion.entity';
import * as bcrypt from 'bcrypt';
import { SocketGateway } from 'src/socket/socket.gateway';
import { RoleName } from 'src/common/enums/enums';
import { ApiResponseMessages } from 'src/common/api-messages.constants';
import { UserPersonalInfo } from 'src/user-personal-info/entities/user-personal-info.entity';
import { RedisCacheService } from 'src/common/cache/redis-cache.service';
import { buildAuthGuardUserCachePrefix } from 'src/auth/auth-user-query.util';
import { PASSWORD_SALT_ROUNDS } from 'src/common/app.constants';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>,
    @InjectRepository(UserPermission)
    private readonly userPermissionsRepository: Repository<UserPermission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserPersonalInfo)
    private readonly personalInfoRepository: Repository<UserPersonalInfo>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionsRepository: Repository<RolePermission>,
    private readonly dataSource: DataSource,
    private readonly socketGateway: SocketGateway,
    private readonly redisCacheService: RedisCacheService,
  ) { }
  private readonly logger: Logger = new Logger(UsersService.name);

  async create(createUserDto: CreateUserDto): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { password, role_id, facility_id, ...rest } = createUserDto;
      const hashedPassword = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

      const user = this.usersRepository.create({
        ...rest,
        password: hashedPassword,
        role: { id: role_id },
        facility: { id: facility_id },
      });
      const savedUser = await queryRunner.manager.save(user);

      const rolePermission = await queryRunner.manager.findOne(RolePermission, {
        where: { role: { id: role_id } },
      });

      if (!rolePermission) {
        throw new Error(
          `No default role permission found for role_id: ${role_id}`,
        );
      }

      const permission = queryRunner.manager.create(Permission, {
        payload: rolePermission.payload,
        created_at: new Date(),
        updated_at: new Date(),
        role: { id: role_id },
      });
      const savedPermission = await queryRunner.manager.save(permission);

      const userPermission = queryRunner.manager.create(UserPermission, {
        user: { id: savedUser.id },
        permission: { id: savedPermission.id },
      });
      await queryRunner.manager.save(userPermission);

      await queryRunner.commitTransaction();
      await this.invalidateAuthGuardUserCache(savedUser.id);

      return successResponse(savedUser, 'User created successfully', 201);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return errorResponse('Failed to create user', 400, error.message);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(user: any, filters: UserSearchDto): Promise<any> {
    try {
      const currentUserId = user.sub;
      const currentRole = user.role;
      const currentFacilityId = user.facilityId;

      const qb = this.usersRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.role', 'role')
        .leftJoinAndSelect('user.facility', 'facility')
        .leftJoinAndSelect('user.personalInfo', 'userPersonalInfo')
        // ✅ Join through the UserService junction table
        .leftJoinAndSelect('user.userServices', 'userServices')
        .leftJoinAndSelect('userServices.service', 'services')
        // Add location relations directly
        .leftJoinAndSelect('user.division', 'division')
        .leftJoinAndSelect('user.district', 'district')
        .leftJoinAndSelect('user.taluka', 'taluka')
        .leftJoinAndSelect('user.uc', 'uc')
        .leftJoin('user.userPermissions', 'userPermission')
        .leftJoinAndSelect('userPermission.permission', 'permission')
        .where('role.name != :roleName', { roleName: RoleName.SUPER_ADMIN })
        .andWhere('user.id != :currentUserId', { currentUserId });

      if (currentRole === RoleName.FACILITY_INCHARGE) {
        qb.andWhere('user.facility_id = :facilityId', {
          facilityId: currentFacilityId,
        }).andWhere('role.name NOT IN (:...restrictedRoles)', {
          restrictedRoles: [
            RoleName.SUPER_ADMIN,
            RoleName.ADMIN,
            RoleName.HEAD_OFFICE,
          ],
        });
      } else if (currentRole === RoleName.HEAD_OFFICE) {
        qb.andWhere('role.name NOT IN (:...restrictedRoles)', {
          restrictedRoles: [RoleName.SUPER_ADMIN, RoleName.ADMIN],
        });
      } else if (currentRole === RoleName.ADMIN) {
        qb.andWhere('role.name != :restrictedRole', {
          restrictedRole: RoleName.SUPER_ADMIN,
        });
      }

      if (filters.facility_id) {
        qb.andWhere('user.facility_id = :facilityId', { facilityId: filters.facility_id });
      }

      if (filters.status) {
        qb.andWhere('user.status = :status', { status: filters.status });
      }

      if (filters.first_name) {
        qb.andWhere('user.first_name ILIKE :first_name', {
          first_name: `%${filters.first_name}%`,
        });
      }

      if (filters.last_name) {
        qb.andWhere('user.last_name ILIKE :last_name', {
          last_name: `%${filters.last_name}%`,
        });
      }

      if (filters.email) {
        qb.andWhere('user.email ILIKE :email', { email: `%${filters.email}%` });
      }

      if (filters.roles && filters.roles.length > 0) {
        qb.andWhere('role.name IN (:...roles)', { roles: filters.roles });
      }

      qb.select([
        'user.id',
        'user.first_name',
        'user.last_name',
        'user.email',
        'user.status',
        'user.district_id',
        'user.division_id',
        'user.taluka_id',
        'user.uc_id',
        'user.must_change_password',
        'role.id',
        'role.name',
        'facility.id',
        'facility.name',
        // Location names
        'division.id',
        'division.name',
        'district.id',
        'district.name',
        'taluka.id',
        'taluka.name',
        'uc.id',
        'uc.name',
        // Personal info
        'userPersonalInfo.cnic',
        'userPersonalInfo.dob',
        'userPersonalInfo.contact',
        'userPersonalInfo.address',
        'userPersonalInfo.gender',
        'userPersonalInfo.qualifications',
        'userPersonalInfo.specialization',
        'userPersonalInfo.emergency_contact',
        'userPersonalInfo.blood_type',
        'userPersonalInfo.marital_status',
        'userPersonalInfo.nationality',
        'userPersonalInfo.religion',
        'userPermission.id',
        'permission.payload',
        // ✅ UserService junction table (includes created_at)
        'userServices',  // This will include ALL columns from UserService
        // ✅ Service details (NO created_at here)
        'services.id',
        'services.name',
      ]);

      const skip = (filters.page - 1) * filters.limit;
      qb.skip(skip).take(filters.limit);

      const [data, count] = await qb.getManyAndCount();

      const message = count === 0 ? 'No Data Found' : 'Users fetched successfully';
      return successResponse(
        data,
        message,
        200,
        filters.page,
        filters.limit,
        count,
      );
    } catch (error) {
      console.error('Error fetching users:', error); // ✅ See the actual error
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  async findByEmail(email: string) {
    try {
      return this.usersRepository
        .createQueryBuilder('user')
        .setFindOptions({
          where: { email },
          relations: [
            'personalInfo',
            'role',
            'facility',
            'facility.district',
            'facility.district.division',
            'facility.uc',
            'facility.uc.taluka',
            'userPermissions.permission',
            'services',
          ],
        })
        .addSelect('user.password')
        .getOne();
    } catch (error) {
      this.logger.error(`Error finding user by email: ${email}`, error.stack);
      throw new InternalServerErrorException('Failed to find user by email');
    }
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const {
        role_id,
        facility_id,
        division_id,
        district_id,
        taluka_id,
        uc_id,
        cnic,
        dob,
        gender,
        blood_type,
        contact,
        emergency_contact,
        address,
        qualifications,
        specialization,
        marital_status,
        nationality,
        religion,
        ...rest
      } = updateUserDto;

      const updatePayload: any = { ...rest };

      // ✅ Handle Role Update
      if (role_id) {
        updatePayload.role = { id: role_id };

        const role = await queryRunner.manager.findOne(
          this.roleRepository.target,
          {
            where: { id: role_id },
          },
        );
        if (!role) {
          throw new Error(`Role with id ${role_id} not found`);
        }
        let rolePermission = await queryRunner.manager.findOne(
          this.rolePermissionsRepository.target,
          {
            where: { role: { id: role_id } },
          },
        );

        if (!rolePermission) {
          rolePermission = queryRunner.manager.create(
            this.rolePermissionsRepository.target,
            {
              role: { id: role_id },
              payload: [],
            },
          );
          rolePermission = await queryRunner.manager.save(rolePermission);
        }
        // Check if trying to create a facility incharge for a facility that already has one
        if (updateUserDto.role_id && updateUserDto.facility_id) {
          const role = await this.roleRepository.findOne({
            where: { id: Number(updateUserDto.role_id) },
          });

          if (role && role.name === RoleName.FACILITY_INCHARGE) {
            const existingIncharge = await this.usersRepository.findOne({
              where: {
                facility: { id: Number(updateUserDto.facility_id) },
                role: { name: RoleName.FACILITY_INCHARGE },
              },
              relations: ['role', 'facility'],
            });

            if (existingIncharge && existingIncharge.id !== id) {
              throw new ConflictException(
                `${ApiResponseMessages.FACILITY_INCHARGE_EXISTS} `
              );
            }
          }
        }
        let payload: any[] = [];

        const userPermission = await queryRunner.manager.findOne(
          this.userPermissionsRepository.target,
          {
            where: { user: { id: id } },
            relations: ['permission', 'user.role'],
          },
        );

        if (userPermission) {
          if (!userPermission.permission) {
            const dedicatedPermission = await queryRunner.manager.save(
              this.permissionsRepository.target,
              queryRunner.manager.create(this.permissionsRepository.target, {
                role: { id: role_id },
                payload: [],
              }),
            );
            userPermission.permission = dedicatedPermission;
          }

          payload =
            userPermission?.user.role.id === role_id
              ? userPermission.permission.payload
              : [];

          const sharedPermissionCount = userPermission.permission?.id
            ? await queryRunner.manager.count(this.userPermissionsRepository.target, {
              where: { permission: { id: userPermission.permission.id } },
            })
            : 0;

          if (sharedPermissionCount > 1) {
            let dedicatedPermission = queryRunner.manager.create(
              this.permissionsRepository.target,
              {
                role: { id: role_id },
                payload: JSON.parse(
                  JSON.stringify(userPermission.permission.payload ?? []),
                ),
              },
            );

            dedicatedPermission = await queryRunner.manager.save(
              dedicatedPermission,
            );
            userPermission.permission = dedicatedPermission;
          }

          userPermission.permission.payload = payload;
          userPermission.permission.role = role;
          await queryRunner.manager.save(userPermission);
        } else {
          payload = rolePermission.payload ?? [];
          const permission = queryRunner.manager.create(
            this.permissionsRepository.target,
            {
              role: { id: role_id },
              payload: payload,
            },
          );

          await queryRunner.manager.save(permission);

          const userPermission = queryRunner.manager.create(
            this.userPermissionsRepository.target,
            {
              user: { id: id },
              permission: permission,
            },
          );

          await queryRunner.manager.save(userPermission);
        }
      }

      // ✅ Handle Facility Update
      if (facility_id) {
        updatePayload.facility = { id: facility_id };
      }

      // ✅ Handle Location Updates
      if (division_id) {
        updatePayload.division = { id: division_id };
      }
      if (district_id) {
        updatePayload.district = { id: district_id };
      }
      if (taluka_id) {
        updatePayload.taluka = { id: taluka_id };
      }
      if (uc_id) {
        updatePayload.uc = { id: uc_id };
      }

      // ✅ Update User Entity
      await queryRunner.manager.update(
        this.usersRepository.target,
        id,
        updatePayload,
      );

      // ✅ Handle Personal Info Updates
      const personalInfoData: any = {};
      if (cnic !== undefined) personalInfoData.cnic = cnic;
      if (dob !== undefined) personalInfoData.dob = dob;
      if (gender !== undefined) personalInfoData.gender = gender;
      if (blood_type !== undefined) personalInfoData.blood_type = blood_type;
      if (contact !== undefined) personalInfoData.contact = contact;
      if (emergency_contact !== undefined) personalInfoData.emergency_contact = emergency_contact;
      if (address !== undefined) personalInfoData.address = address;
      if (qualifications !== undefined) personalInfoData.qualifications = qualifications;
      if (specialization !== undefined) personalInfoData.specialization = specialization;
      if (marital_status !== undefined) personalInfoData.marital_status = marital_status;
      if (nationality !== undefined) personalInfoData.nationality = nationality;
      if (religion !== undefined) personalInfoData.religion = religion;

      // Update or create personal info if any fields are provided
      if (Object.keys(personalInfoData).length > 0) {
        // Check if personal info exists
        const existingPersonalInfo = await queryRunner.manager.findOne(
          this.personalInfoRepository.target,
          {
            where: { user: { id } },
          },
        );

        if (existingPersonalInfo) {
          // Update existing personal info
          await queryRunner.manager.update(
            this.personalInfoRepository.target,
            { user: { id } },
            personalInfoData,
          );
        } else {
          // Create new personal info
          const newPersonalInfo = queryRunner.manager.create(
            this.personalInfoRepository.target,
            {
              ...personalInfoData,
              user: { id },
            },
          );
          await queryRunner.manager.save(newPersonalInfo);
        }
      }

      await queryRunner.commitTransaction();
      await this.invalidateAuthGuardUserCache(id);

      // ✅ Fetch Updated User with All Relations
      const response = await queryRunner.manager.findOne(
        this.usersRepository.target,
        {
          where: { id },
          relations: [
            'userPermissions',
            'userPermissions.permission',
            'role',
            'facility',
            'services',
            'division',
            'district',
            'taluka',
            'uc',
            'personalInfo',
          ],
        },
      );

      this.socketGateway.emitToUser(id, 'user_updated', { user: response });
      return successResponse(response, 'User updated successfully', 200);
    } catch (error) {
      await queryRunner.rollbackTransaction();


      if (error instanceof ConflictException) {
        throw error;
      }


      if (error instanceof NotFoundException ||
        error instanceof UnauthorizedException) {
        throw error;
      }

      // For other errors, throw InternalServerErrorException
      this.logger.error('User update failed', error.stack);
      throw new InternalServerErrorException(
        error.message || 'User update failed'
      );
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });
    if (!user) {
      return errorResponse('User not found', 404);
    }

    await this.usersRepository.softRemove(user);
    await this.invalidateAuthGuardUserCache(id);
    return successResponse(user, 'User deleted successfully', 200);
  }

  private async invalidateAuthGuardUserCache(userId: number): Promise<void> {
    await this.redisCacheService.deleteByPrefix(
      buildAuthGuardUserCachePrefix(userId),
    );
  }
}
