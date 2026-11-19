import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  defaultAdminPayload,
  defaultDispenserPayload,
  defaultFacilityInchargePayload,
  defaultHeadOfficePayload,
  defaultMedicalOfficerFemalePayload,
  defaultMedicalOfficerMalePayload,
  defaultPaedsPayload,
  defaultRegistrationClerkPayload,
  defaultSbaPayload,
  defaultTelehealthConsultantPayload,
  defaultUserPayload,
  defaultVaccinatorPayload,
} from 'src/common/default-payload';
import { RolePermission } from 'src/role-permisssions/entities/role-permisssion.entity';
import { Role } from 'src/roles/entities/role.entity';
import { Repository } from 'typeorm';
import { mergeSeededPayload, payloadsAreEqual } from '../payload-seeder.util';

@Injectable()
export class RolePermissionSeeder {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async seed() {
    const rolePayloadMap: Record<string, any[]> = {
      user: defaultUserPayload,
      registration_clerk: defaultRegistrationClerkPayload,
      admin: defaultAdminPayload,
      super_admin: defaultAdminPayload,
      facility_incharge: defaultFacilityInchargePayload,
      head_office: defaultHeadOfficePayload,
      sba: defaultSbaPayload,
      dispenser: defaultDispenserPayload,
      paeds: defaultPaedsPayload,
      vaccinator: defaultVaccinatorPayload,
      medical_officer_male: defaultMedicalOfficerMalePayload,
      medical_officer_female: defaultMedicalOfficerFemalePayload,
      telehealth_consultant: defaultTelehealthConsultantPayload,
    };

    const roles = await this.roleRepository.find();
    console.log('Seeding role permissions...');

    for (const role of roles) {
      const seededPayload = rolePayloadMap[role.name.toLowerCase()] || defaultUserPayload;
      const existingRolePermission = await this.rolePermissionRepository.findOne({
        where: { role: { id: role.id } },
      });

      if (!existingRolePermission) {
        const rolePermission = this.rolePermissionRepository.create({
          role: { id: role.id },
          payload: seededPayload,
        });
        await this.rolePermissionRepository.save(rolePermission);
        console.log(`Created role permissions for role "${role.name}"`);
        continue;
      }

      const mergedPayload = mergeSeededPayload(
        existingRolePermission.payload ?? [],
        seededPayload,
      );

      if (
        payloadsAreEqual(existingRolePermission.payload ?? [], mergedPayload)
      ) {
        console.log(`Role permissions for role "${role.name}" are already in sync.`);
        continue;
      }

      existingRolePermission.payload = mergedPayload;
      await this.rolePermissionRepository.save(existingRolePermission);
      console.log(`Updated role permissions for role "${role.name}"`);
    }

    console.log('Role permissions seeding completed.');
  }
}
