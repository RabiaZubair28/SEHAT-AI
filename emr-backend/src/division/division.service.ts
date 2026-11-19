import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Division } from './entities/division.entity';
import { Repository } from 'typeorm';
import { successResponse } from 'src/common/utils/response.util';
import { RedisCacheService } from 'src/common/cache/redis-cache.service';
import { DIVISION_CACHE_TTL_SECONDS } from 'src/common/app.constants';

@Injectable()
export class DivisionService {
  constructor(
    @InjectRepository(Division)
    private readonly divisionRepository: Repository<Division>,
    private readonly redisCacheService: RedisCacheService,
  ) {}
  async findAll() {
    return this.redisCacheService.getOrSetJson(
      'division:all',
      DIVISION_CACHE_TTL_SECONDS,
      async () => {
        const response = await this.divisionRepository.find({
          select: ['id', 'name'],
        });
        return successResponse(response, 'Division fetched successfully', 200);
      },
    );
  }
}
