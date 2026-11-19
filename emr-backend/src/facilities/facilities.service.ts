import { Injectable, Logger } from '@nestjs/common';
import { CreateFacilityDto } from './dto/create-facility.dto';
import { FindOptionsWhere, Raw, Repository } from 'typeorm';
import { Facility } from './entities/facility.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { successResponse } from 'src/common/utils/response.util';
import { ApiResponseMessages } from 'src/common/api-messages.constants';
import { ExceptionUtility } from 'src/common/utils/helper.util';
import { ApiSuccessResponseMessages } from 'src/common/api-success-messages.constant';
import { FacilityDistrictFiltersDto } from './dto/facility-district-filters.dto';
import { RedisCacheService } from 'src/common/cache/redis-cache.service';
import { FACILITIES_CACHE_TTL_SECONDS } from 'src/common/app.constants';
import { RoleName } from 'src/common/enums/enums';

@Injectable()
export class FacilitiesService {
  private readonly logger: Logger = new Logger(FacilitiesService.name);
  private static readonly EXCLUDED_FACILITY_TYPE = 'TEST';
  private static readonly CLIENT_AUTH_PROVINCE = 'sindh';

  constructor(
    @InjectRepository(Facility)
    private readonly facilityRepository: Repository<Facility>,
    private readonly redisCacheService: RedisCacheService,
  ) { }

  async create(createFacilityDto: CreateFacilityDto) {
    const facility = this.facilityRepository.create(createFacilityDto);
    const savedFacility = await this.facilityRepository.save(facility);
    await this.redisCacheService.deleteByPrefix('facilities:findAll');
    return savedFacility;
  }

  async findAll(filters: any) {
    try {
      const page = parseInt(filters.page, 10) || 1;
      const limit = parseInt(filters.limit, 10) || 10;
      const isFacilityIncharge = filters.role === RoleName.FACILITY_INCHARGE;
      const cacheKey = this.redisCacheService.buildKey('facilities:findAll', {
        code: filters.code,
        facility_id: filters.facility_id ? parseInt(filters.facility_id, 10) : null,
        limit,
        location: filters.location,
        managedByPPHI: filters.managedByPPHI,
        name: filters.name,
        page,
        role: filters.role,
        isClientAuth: filters.isClientAuth,
      });

      return this.redisCacheService.getOrSetJson(
        cacheKey,
        FACILITIES_CACHE_TTL_SECONDS,
        async () => {
          if (filters.facility_id) {
            const whereClause: any = {
              id: parseInt(filters.facility_id, 10),
            };

            if (!isFacilityIncharge) {
              whereClause.facility_type = Raw(
                (alias) =>
                  `COALESCE(UPPER(${alias}), '') <> :excludedFacilityType`,
                {
                  excludedFacilityType: FacilitiesService.EXCLUDED_FACILITY_TYPE,
                },
              );
            }

            if (filters.isClientAuth) {
              whereClause.district = {
                division: {
                  province: {
                    name: Raw((alias) => `LOWER(${alias}) = :provinceName`, {
                      provinceName: FacilitiesService.CLIENT_AUTH_PROVINCE,
                    }),
                  },
                },
              };
            }
            const facility = await this.facilityRepository.findOne({
              where: whereClause,
              relations: filters.isClientAuth
                ? ['district', 'district.division', 'district.division.province']
                : undefined,
            });

            if (!facility) {
              return successResponse([], 'No Data Found', 200, 1, 1, 0);
            }

            return successResponse(
              [facility],
              'Facility fetched successfully',
              200,
              1,
              1,
              1,
            );
          }

          const queryBuilder = this.facilityRepository
            .createQueryBuilder('facility')
            .leftJoinAndSelect('facility.district', 'district')
            .leftJoin('district.division', 'division')
            .leftJoin('division.province', 'province')
            .andWhere(
              "COALESCE(UPPER(facility.facility_type), '') <> :excludedFacilityType",
              {
                excludedFacilityType: FacilitiesService.EXCLUDED_FACILITY_TYPE,
              },
            );

          if (filters.name) {
            queryBuilder.andWhere('facility.name ILIKE :name', {
              name: `%${filters.name}%`,
            });
          }

          if (filters.isClientAuth) {
            queryBuilder.andWhere('LOWER(province.name) = :provinceName', {
              provinceName: FacilitiesService.CLIENT_AUTH_PROVINCE,
            });
          }

          if (filters.code) {
            queryBuilder.andWhere('CAST(facility.code AS TEXT) LIKE :code', {
              code: `%${filters.code}%`,
            });
          }

          if (filters.location) {
            queryBuilder.andWhere('facility.location ILIKE :location', {
              location: `%${filters.location}%`,
            });
          }

          if (filters.managedByPPHI !== undefined && filters.managedByPPHI === true) {
            queryBuilder.andWhere('facility.managed_by = :managedByPPHI', {
              managedByPPHI: 'PPHI',
            });
          }

          const skip = (page - 1) * limit;

          queryBuilder.skip(skip).take(limit);

          const [data, count] = await queryBuilder.getManyAndCount();

          const message =
            count === 0 ? 'No Data Found' : 'Facilities fetched successfully';

          return successResponse(data, message, 200, page, limit, count);
        },
      );
    } catch (error) {
      this.logger.error(ApiResponseMessages.FAC_FET_FAILED, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.FAC_FET_FAILED,
      );
    }
  }

  async findByDistrictId(
    districtId: number,
    filters: FacilityDistrictFiltersDto,
    isClientAuth = false,
  ) {
    try {
      const whereCondition: FindOptionsWhere<Facility> = {
        district: {
          id: districtId,
        },
        facility_type: Raw(
          (alias) =>
            `COALESCE(UPPER(${alias}), '') <> :excludedFacilityType`,
          {
            excludedFacilityType: FacilitiesService.EXCLUDED_FACILITY_TYPE,
          },
        ),
      };

      if (filters.LevelOfCare) {
        whereCondition.level_of_care = filters.LevelOfCare;
      }

      if (filters.managedByPPHI !== undefined && filters.managedByPPHI === true) {
        whereCondition.managed_by = 'PPHI';
      }

      if (isClientAuth) {
        whereCondition.district = {
          id: districtId,
          division: {
            province: {
              name: Raw((alias) => `LOWER(${alias}) = :provinceName`, {
                provinceName: FacilitiesService.CLIENT_AUTH_PROVINCE,
              }),
            },
          },
        };
      }

      const [data, count] = await this.facilityRepository.findAndCount({
        where: whereCondition,
        relations: isClientAuth
          ? ['district', 'district.division', 'district.division.province']
          : ['district'],
        take: filters.limit,
        skip: (filters.page - 1) * filters.limit,
        order: { created_at: 'DESC' },
      });
      return successResponse(
        data,
        ApiSuccessResponseMessages.FAC_FET_SUCCESS,
        200,
        filters.page,
        filters.limit,
        count,
      );
    } catch (error) {
      this.logger.error(
        ApiResponseMessages.FAC_FET_FAILED_BY_DISTRICT_ID,
        error.stack,
      );
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.FAC_FET_FAILED_BY_DISTRICT_ID,
      );
    }
  }
}
