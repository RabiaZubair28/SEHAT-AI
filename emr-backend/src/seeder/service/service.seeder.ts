import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from 'src/services/entities/service.entity';

@Injectable()
export class ServiceSeeder {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  async seed() {
    console.log('🚀 Seeding services...');

    const services = [
      { name: 'OPD' },
      { name: 'ANC' },
      { name: 'DELIVERY' },
      { name: 'PNC' },
      { name: 'FAMILY_PLANNING' },
      { name: 'IMMUNISATION' },
      { name: 'NUTRITION' },
      { name: 'MEDICINE_DISPENSING' },
    ];

    for (const serviceData of services) {
      const existing = await this.serviceRepository.findOne({
        where: { name: serviceData.name },
      });
      if (!existing) {
        const service = this.serviceRepository.create(serviceData);
        await this.serviceRepository.save(service);
        console.log(`✅ Created service: ${serviceData.name}`);
      } else {
        console.log(
          `⚠️ Service "${serviceData.name}" already exists, skipping.`,
        );
      }
    }

    console.log('🎉 Service seeding completed!');
  }
}
