import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleName } from 'src/common/enums/enums';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  create(createRoleDto: CreateRoleDto) {
    const role = this.roleRepository.create(createRoleDto);
    return this.roleRepository.save(role);
  }

  async findAll(): Promise<Role[]> {
    return await this.roleRepository.find();
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);
    Object.assign(role, updateRoleDto);
    return await this.roleRepository.save(role);
  }

  async remove(id: number): Promise<void> {
    const result = await this.roleRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
  }

  async findAllByUserRole(userRole: RoleName): Promise<Role[]> {
    const allRoles = await this.roleRepository.find();

    if (userRole === RoleName.SUPER_ADMIN) {
      return allRoles;
    }

    const roleHierarchy = {
      [RoleName.ADMIN]: [RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.HEAD_OFFICE],
      [RoleName.FACILITY_INCHARGE]: [
        RoleName.SUPER_ADMIN,
        RoleName.ADMIN,
        RoleName.HEAD_OFFICE,
        RoleName.FACILITY_INCHARGE,
        RoleName.TELEHEALTH_CONSULTANT,
      ],
    };

    const hiddenRoles = roleHierarchy[userRole] || [];

    const filteredRoles = allRoles.filter(
      (role) => !hiddenRoles.includes(role.name),
    );

    return filteredRoles;
  }
}
