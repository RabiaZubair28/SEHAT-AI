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
  defaultSbaPayload,
  defaultTelehealthConsultantPayload,
  defaultUserPayload,
  defaultVaccinatorPayload,
} from 'src/common/default-payload';
import { RoleName } from 'src/common/enums/enums';
import { Permission } from 'src/permissions/entities/permission.entity';
import { Role } from 'src/roles/entities/role.entity';
import { Repository } from 'typeorm';
import { mergeSeededPayload, payloadsAreEqual } from '../payload-seeder.util';

@Injectable()
export class PermissionSeeder {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) { }

  async seed() {
    console.log('Seeding permissions...');

    const permissionsData: { roleName: string; payload: any[] | null }[] = [
      { roleName: RoleName.SUPER_ADMIN, payload: defaultAdminPayload },
      { roleName: RoleName.ADMIN, payload: defaultAdminPayload },
      {
        roleName: RoleName.FACILITY_INCHARGE,
        payload: defaultFacilityInchargePayload,
      },
      {
        roleName: RoleName.HEAD_OFFICE,
        payload: defaultHeadOfficePayload,
      },
      { roleName: RoleName.REGISTRATION_CLERK, payload: defaultUserPayload },
      { roleName: RoleName.VACCINATOR, payload: defaultVaccinatorPayload },
      { roleName: RoleName.DISPENSER, payload: defaultDispenserPayload },
      {
        roleName: RoleName.MEDICAL_OFFICER_MALE,
        payload: defaultMedicalOfficerMalePayload,
      },
      {
        roleName: RoleName.MEDICAL_OFFICER_FEMALE,
        payload: defaultMedicalOfficerFemalePayload,
      },
      { roleName: RoleName.SBA, payload: defaultSbaPayload },
      { roleName: RoleName.PAEDS, payload: defaultPaedsPayload },
      {
        roleName: RoleName.TELEHEALTH_CONSULTANT,
        payload: defaultTelehealthConsultantPayload,
      },
    ];

    for (const permissionData of permissionsData) {
      const role = await this.roleRepository.findOne({
        where: { name: permissionData.roleName as RoleName },
      });

      if (!role) {
        console.log(`Role "${permissionData.roleName}" does not exist, skipping.`);
        continue;
      }

      const seededPayload = permissionData.payload ?? [];
      const existingPermissions = await this.permissionRepository.find({
        where: { role: { id: role.id } },
        relations: ['role'],
      });

      if (!existingPermissions.length) {
        const newPermission = this.permissionRepository.create({
          role,
          payload: seededPayload,
        });
        await this.permissionRepository.save(newPermission);
        console.log(`Created permission for role "${role.name}"`);
        continue;
      }

      let updatedCount = 0;

      for (const existingPermission of existingPermissions) {
        const mergedPayload = mergeSeededPayload(
          existingPermission.payload ?? [],
          seededPayload,
        );

        if (payloadsAreEqual(existingPermission.payload ?? [], mergedPayload)) {
          continue;
        }

        existingPermission.payload = mergedPayload;
        await this.permissionRepository.save(existingPermission);
        updatedCount++;
      }

      if (updatedCount > 0) {
        console.log(
          `Updated ${updatedCount} permission record(s) for role "${role.name}"`,
        );
      } else {
        console.log(`Permission for role "${role.name}" is already in sync.`);
      }
    }

    console.log('Permission seeding completed.');
  }
}
