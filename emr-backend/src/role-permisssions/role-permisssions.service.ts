import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateRolePermissionDto } from './dto/create-role-permission.dto';
import { RolePermission } from './entities/role-permisssion.entity';

@Injectable()
export class RolePermisssionsService {
  constructor(
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createDto: CreateRolePermissionDto): Promise<RolePermission> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { roleId, payload } = createDto;

      const existing = await queryRunner.manager.findOne(RolePermission, {
        where: { role: { id: roleId } },
      });
      let rolePermission: RolePermission;
      if (existing) {
        existing.role = { id: roleId } as any;
        existing.payload = payload;
        rolePermission = await this.rolePermissionRepository.save(existing);
      } else {
        rolePermission = this.rolePermissionRepository.create({
          role: { id: roleId },
          payload,
        });
      }

      const saved = await queryRunner.manager.save(
        RolePermission,
        rolePermission,
      );
      await queryRunner.commitTransaction();

      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error creating role permission:', error);
      throw new BadRequestException('Failed to create role permission');
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<RolePermission[]> {
    return await this.rolePermissionRepository.find({ relations: ['role'] });
  }

  async findOne(roleId: number): Promise<RolePermission> {
    const rolePermission = await this.rolePermissionRepository.findOne({
      where: { role: { id: roleId } },
    });
    if (!rolePermission) {
      throw new NotFoundException(`RolePermission with ID ${roleId} not found`);
    }
    return rolePermission;
  }

  async remove(id: number): Promise<void> {
    const result = await this.rolePermissionRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`RolePermission with ID ${id} not found`);
    }
  }
}
