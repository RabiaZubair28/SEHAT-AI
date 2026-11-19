import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BloodType, Gender, MaritalStatus } from 'src/common/enums/enums';
import { UserPersonalInfo } from 'src/user-personal-info/entities/user-personal-info.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserPersonalInfoSeeder {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserPersonalInfo)
    private readonly userPersonalInfoRepository: Repository<UserPersonalInfo>,
  ) {}

  async seed() {
    console.log('🚀 Seeding user personal info...');

    // Fetch all users
    const users = await this.userRepository.find();

    for (const user of users) {
      let gender = Gender.MALE;
      if (
        user.email === 'sba@emr.com' ||
        user.email === 'medical_officer_female@emr.com'
      ) {
        gender = Gender.FEMALE;
      }

      const existingPersonalInfo =
        await this.userPersonalInfoRepository.findOne({
          where: { user: { id: user.id } },
          relations: ['user'],
        });

      if (!existingPersonalInfo) {
        const newPersonalInfo = this.userPersonalInfoRepository.create({
          user,
          cnic: `1234567890123`,
          dob: '1990-01-01',
          gender: gender,
          contact: '03001234567',
          address: '123 Street, City, Country',
          qualifications: 'Bachelor of Science',
          specialization: 'Software Engineering',
          emergency_contact: '03009876543',
          blood_type: BloodType.O_POS,
          marital_status: MaritalStatus.SINGLE,
          nationality: 'Pakistani',
          religion: 'Islam',
        });

        await this.userPersonalInfoRepository.save(newPersonalInfo);
        console.log(`✅ Created personal info for user: ${user.email}`);
      } else {
        console.log(
          `⚠️ Personal info for user "${user.email}" already exists, skipping.`,
        );
      }
    }

    console.log('🎉 User personal info seeding completed!');
  }
}
