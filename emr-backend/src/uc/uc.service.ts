import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UC } from './entities/uc.entity';
import { successResponse } from 'src/common/utils/response.util';
import { UcSearchDto } from './dto/search-uc.dto';
import { RedisCacheService } from 'src/common/cache/redis-cache.service';
import { UC_CACHE_TTL_SECONDS } from 'src/common/app.constants';

@Injectable()
export class UcService {
  constructor(
    @InjectRepository(UC)
    private readonly ucRepository: Repository<UC>,
    private readonly redisCacheService: RedisCacheService,
) { }
  async findAll(filters: UcSearchDto) {
    try {
      const cacheKey = this.redisCacheService.buildKey('uc:all', {
        limit: filters.limit,
        name: filters.name,
        page: filters.page,
      });

      return this.redisCacheService.getOrSetJson(
        cacheKey,
        UC_CACHE_TTL_SECONDS,
        async () => {
          const qb = this.ucRepository.createQueryBuilder('uc');

          if (filters.name) {
            qb.andWhere('uc.name ILIKE :name', {
              name: `%${filters.name}%`,
            });
          }

          qb.select(['uc.id', 'uc.name']);

          const skip = (filters.page - 1) * filters.limit;
          qb.skip(skip).take(filters.limit);

          const [data, count] = await qb.getManyAndCount();

          const message =
            count === 0 ? 'No Data Found' : 'UCs fetched successfully';
          return successResponse(
            data,
            message,
            200,
            filters.page,
            filters.limit,
            count,
          );
        },
      );
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new InternalServerErrorException('Failed to fetch UCs');
    }
  }

  async getAllByTalukaId(taluka_id: number): Promise<UC[]> {
    try {
      if (!taluka_id || typeof taluka_id !== 'number') {
        throw new BadRequestException('Invalid taluka_id provided.');
      }

      const ucs = await this.ucRepository.find({
        where: { taluka: { id: taluka_id } },
        relations: ['taluka'],
      });

      if (!ucs || ucs.length === 0) {
        throw new NotFoundException(`No UCs found for taluka_id ${taluka_id}.`);
      }

      return ucs;

    } catch (error) {
      console.error(`Error fetching UCs by taluka_id ${taluka_id}:`, error);

      throw new InternalServerErrorException(
        'An unexpected error occurred while retrieving UCs.',
      );
    }
  }
}