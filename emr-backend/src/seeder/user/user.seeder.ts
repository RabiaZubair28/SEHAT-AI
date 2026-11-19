import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/entities/user.entity';
import { Role } from 'src/roles/entities/role.entity';
import { Facility } from 'src/facilities/entities/facility.entity';
import { RoleName, UserStatus } from 'src/common/enums/enums';
import { PASSWORD_SALT_ROUNDS } from 'src/common/app.constants';

@Injectable()
export class UserSeeder {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Facility)
    private readonly facilityRepository: Repository<Facility>,
  ) { }

  async seed() {
    console.log('🚀 Seeding users...');

    const facility = await this.facilityRepository.findOne({
      where: {},
      order: { id: 'ASC' },
    });

    if (!facility) {
      console.log('⚠️ No facilities found, skipping facility assignment.');
    }
    const defaultPassword = 'Admin@123';
    const usersData: {
      first_name: string;
      last_name: string;
      email: string;
      password: string;
      roleName: RoleName;
    }[] = [
        {
          first_name: 'Super',
          last_name: 'User',
          email: 'super@emr.com',
          password: defaultPassword,
          roleName: RoleName.SUPER_ADMIN,
        },
        {
          first_name: 'Admin',
          last_name: 'User',
          email: 'admin@emr.com',
          password: defaultPassword,
          roleName: RoleName.ADMIN,
        },
        {
          first_name: 'Facility',
          last_name: 'Incharge',
          email: 'facility@emr.com',
          password: defaultPassword,
          roleName: RoleName.FACILITY_INCHARGE,
        },
        {
          first_name: 'Head',
          last_name: 'Office',
          email: 'headoffice@emr.com',
          password: defaultPassword,
          roleName: RoleName.HEAD_OFFICE,
        },
        {
          first_name: 'FrontDesk',
          last_name: 'User',
          email: 'frontdesk@emr.com',
          password: defaultPassword,
          roleName: RoleName.REGISTRATION_CLERK,
        },
        {
          first_name: 'SBA',
          last_name: 'User',
          email: 'sba@emr.com',
          password: defaultPassword,
          roleName: RoleName.SBA,
        },
        {
          first_name: 'Vaccinator',
          last_name: 'User',
          email: 'vaccinator@emr.com',
          password: defaultPassword,
          roleName: RoleName.VACCINATOR,
        },
        {
          first_name: 'Dispenser',
          last_name: 'User',
          email: 'dispenser@emr.com',
          password: defaultPassword,
          roleName: RoleName.DISPENSER,
        },
        {
          first_name: 'Medical',
          last_name: 'Officer Male',
          email: 'medical_officer_male@emr.com',
          password: defaultPassword,
          roleName: RoleName.MEDICAL_OFFICER_MALE,
        },
        {
          first_name: 'Medical',
          last_name: 'Officer Female',
          email: 'medical_officer_female@emr.com',
          password: defaultPassword,
          roleName: RoleName.MEDICAL_OFFICER_FEMALE,
        },
        {
          first_name: 'Paediatric',
          last_name: 'User',
          email: 'paeds@emr.com',
          password: defaultPassword,
          roleName: RoleName.PAEDS,
        },
      ];

    for (const userData of usersData) {
      const existingUser = await this.userRepository.findOne({
        where: { email: userData.email },
      });

      if (!existingUser) {
        const role = await this.roleRepository.findOne({
          where: { name: userData.roleName },
        });

        if (!role) {
          console.log(`⚠️ Role "${userData.roleName}" not found, skipping.`);
          continue;
        }

        const hashedPassword = await bcrypt.hash(userData.password, PASSWORD_SALT_ROUNDS);
        const facilityAvailablityCheck = [
          RoleName.ADMIN,
          RoleName.SUPER_ADMIN,
          RoleName.HEAD_OFFICE,
        ].includes(userData.roleName)
          ? undefined
          : facility || undefined;

        const newUser = this.userRepository.create({
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          password: hashedPassword,
          role,
          facility: facilityAvailablityCheck,
          division_id: 1,
          district_id: 1,
          taluka_id: 1,
          uc_id: 24,
          status: UserStatus.APPROVED,
        });

        await this.userRepository.save(newUser);
        console.log(
          `✅ Created user: ${userData.email} with role "${role.name}"`,
        );
      } else {
        console.log(
          `⚠️ User with email "${userData.email}" already exists, skipping.`,
        );
      }
    }

    console.log('🎉 User seeding completed!');
  }
}
