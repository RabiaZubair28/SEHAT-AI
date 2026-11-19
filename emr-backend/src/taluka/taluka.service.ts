import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Taluka } from './entities/taluka.entity';
import { Repository } from 'typeorm';
import { successResponse } from 'src/common/utils/response.util';
import { RedisCacheService } from 'src/common/cache/redis-cache.service';
import { TALUKA_CACHE_TTL_SECONDS } from 'src/common/app.constants';

@Injectable()
export class TalukaService {
  constructor(
    @InjectRepository(Taluka)
    private readonly talukaRepository: Repository<Taluka>,
    private readonly redisCacheService: RedisCacheService,
  ) {}
  async findAll() {
    return this.redisCacheService.getOrSetJson(
      'taluka:all',
      TALUKA_CACHE_TTL_SECONDS,
      async () => {
        const response = await this.talukaRepository.find({
          select: ['id', 'name'],
        });
        return successResponse(response, 'Taluka fetched successfully', 200);
      },
    );
  }

  async findAllByDistrict(district_id: number) {
    const response = await this.talukaRepository
      .createQueryBuilder('taluka')
      .innerJoin('taluka.district', 'district')
      .where('district.id = :district_id', { district_id })
      .select(['taluka.id AS id', 'taluka.name AS name'])
      .getRawMany();

    return successResponse(response, 'Taluka fetched successfully', 200);
  }
}
