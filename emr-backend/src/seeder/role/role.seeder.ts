import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleName } from 'src/common/enums/enums';
import { Role } from 'src/roles/entities/role.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RoleSeeder {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) { }

  async seed() {
    console.log('🚀 Seeding roles...');

    const roles: {
      name: RoleName;
      description: string;
    }[] = [
        {
          name: RoleName.SUPER_ADMIN,
          description: 'Has full access to the system',
        },
        {
          name: RoleName.ADMIN,
          description: 'Has full access to the system after super admin',
        },
        {
          name: RoleName.FACILITY_INCHARGE,
          description: 'Oversees operations at the healthcare facility',
        },
        {
          name: RoleName.HEAD_OFFICE,
          description: 'Head office staff with access to multiple facilities',
        },
        {
          name: RoleName.REGISTRATION_CLERK,
          description: 'Manages patient check-ins and appointments',
        },
        {
          name: RoleName.VACCINATOR,
          description: 'Administers vaccinations',
        },
        {
          name: RoleName.DISPENSER,
          description: 'Dispenses medicines and assists with prescriptions',
        },
        {
          name: RoleName.MEDICAL_OFFICER_MALE,
          description: 'Responsible for medical oversight and patient care, male',
        },
        {
          name: RoleName.MEDICAL_OFFICER_FEMALE,
          description:
            'Responsible for medical oversight and patient care female',
        },
        {
          name: RoleName.SBA,
          description: 'Skilled Birth Attendant, provides maternal care',
        },
        {
          name: RoleName.PAEDS,
          description: 'Paediatrician, provides care for children',
        },
        {
          name: RoleName.TELEHEALTH_CONSULTANT,
          description: 'Provides specialist telehealth consultations remotely',
        },
      ];

    for (const roleData of roles) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: roleData.name },
      });

      if (!existingRole) {
        const newRole = this.roleRepository.create(roleData);
        await this.roleRepository.save(newRole);
        console.log(`✅ Created role: ${roleData.name}`);
      } else {
        console.log(`⚠️ Role "${roleData.name}" already exists, skipping.`);
      }
    }

    console.log('🎉 Role seeding completed!');
  }
}
