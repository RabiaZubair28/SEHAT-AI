import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { District } from './entities/district.entity';
import { Repository } from 'typeorm';
import { successResponse } from 'src/common/utils/response.util';
import { RedisCacheService } from 'src/common/cache/redis-cache.service';
import { DISTRICT_CACHE_TTL_SECONDS } from 'src/common/app.constants';

@Injectable()
export class DistrictsService {
  private static readonly CLIENT_AUTH_PROVINCE = 'sindh';

  constructor(
    @InjectRepository(District)
    private readonly districtRepository: Repository<District>,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  async findAll(isClientAuth = false) {
    return this.redisCacheService.getOrSetJson(
      isClientAuth ? 'district:all:province:sindh' : 'district:all',
      DISTRICT_CACHE_TTL_SECONDS,
      async () => {
        const queryBuilder = this.districtRepository
          .createQueryBuilder('district')
          .select(['district.id', 'district.name']);

        if (isClientAuth) {
          queryBuilder
            .innerJoin('district.division', 'division')
            .innerJoin('division.province', 'province')
            .where('LOWER(province.name) = :provinceName', {
              provinceName: DistrictsService.CLIENT_AUTH_PROVINCE,
            });
        }

        const response = await queryBuilder.getMany();
        return successResponse(response, 'District fetched successfully', 200);
      },
    );
  }

  async findAllByDivision(division_id: number, isClientAuth = false) {
    const queryBuilder = this.districtRepository
      .createQueryBuilder('district')
      .innerJoin('district.division', 'division')
      .where('division.id = :division_id', { division_id })
      .select(['district.id', 'district.name']);

    if (isClientAuth) {
      queryBuilder
        .innerJoin('division.province', 'province')
        .andWhere('LOWER(province.name) = :provinceName', {
          provinceName: DistrictsService.CLIENT_AUTH_PROVINCE,
        });
    }

    const response = await queryBuilder.getMany();
    return successResponse(response, 'District fetched successfully', 200);
  }
}
