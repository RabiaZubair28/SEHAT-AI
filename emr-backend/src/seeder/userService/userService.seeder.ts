import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Service } from 'src/services/entities/service.entity';
import { UserService } from 'src/user-services/entities/user-service.entity';

@Injectable()
export class UserServiceSeeder {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,

    @InjectRepository(UserService)
    private readonly userServiceRepository: Repository<UserService>,
  ) {}

  async seed() {
    console.log('Seeding services for users (user_service)...');

    const mapping: Record<string, string[]> = {
      sba: [
        'ANC',
        'DELIVERY',
        'PNC',
        'FAMILY_PLANNING',
        'NUTRITION',
      ],
      medical_officer_male: ['OPD', 'NUTRITION'],
      medical_officer_female: [
        'OPD',
        'ANC',
        'NUTRITION',
        'DELIVERY',
        'PNC',
        'FAMILY_PLANNING',
      ],
      vaccinator: ['IMMUNISATION'],
      dispenser: ['MEDICINE_DISPENSING'],
      paeds: ['OPD'],
    };

    const users = await this.userRepository.find({
      relations: ['role'],
    });

    if (!users.length) {
      console.log('No users found. Skipping user-service seeding.');
      return;
    }

    const createdByUser =
      users.find((u) => u.email === 'super@emr.com') ?? users[0];

    const services = await this.serviceRepository.find();
    const serviceMap = Object.fromEntries(services.map((s) => [s.name, s]));

    for (const user of users) {
      const roleName = user.role?.name;
      if (!roleName || !mapping[roleName]) {
        console.log(
          `User ${user.id} has unknown or unmapped role "${roleName}". Skipping.`,
        );
        continue;
      }

      const serviceNames = mapping[roleName];
      const assignedServices = serviceNames
        .map((name) => {
          const service = serviceMap[name];
          if (!service) {
            console.warn(`Service "${name}" not found for role "${roleName}"`);
          }
          return service;
        })
        .filter(Boolean) as Service[];

      await this.userServiceRepository.delete({ userId: user.id });

      if (!assignedServices.length) {
        console.log(
          `No valid services found for user ${user.id} (${roleName}). Skipping.`,
        );
        continue;
      }

      const userServices = assignedServices.map((service) =>
        this.userServiceRepository.create({
          user,
          service,
          userId: user.id,
          serviceId: service.id,
          createdBy: { id: createdByUser.id } as User,
        }),
      );

      await this.userServiceRepository.save(userServices);
      console.log(
        `Assigned ${assignedServices.length} services to user ${user.id} (${roleName})`,
      );
    }

    console.log('User-service seeding completed!');
  }
}
