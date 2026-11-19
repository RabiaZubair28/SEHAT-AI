import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Raw, Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

import { Facility } from './entities/facility.entity';
import { District } from 'src/districts/entities/district.entity';
import { Taluka } from 'src/taluka/entities/taluka.entity';
import { UC } from 'src/uc/entities/uc.entity';
import { LevelOfCare } from 'src/common/enums/enums';
import { RedisCacheService } from 'src/common/cache/redis-cache.service';
import { successResponse } from 'src/common/utils/response.util';
import { ExceptionUtility } from 'src/common/utils/helper.util';
import { ApiResponseMessages } from 'src/common/api-messages.constants';
import { ApiSuccessResponseMessages } from 'src/common/api-success-messages.constant';
import {
  BulkCreateFacilitiesDto,
  BulkFacilityRowDto,
  BulkRowError,
  mapValidationErrorsToRowErrors,
} from './dto/bulk-create-facilities.dto';

type Resolution<T> =
  | { ok: true; value: T }
  | { ok: false; field: string; message: string };

interface PreparedFacilityRow {
  rowNumber: number;
  name: string;
  code?: number;
  district: District;
  uc?: UC;
  facility_type?: string;
  managed_by?: string;
  is_24_7: boolean;
  bmu: boolean;
  otp: boolean;
  nsc: boolean;
  lat?: number;
  long?: number;
  level_of_care?: LevelOfCare;
}

interface GeographyCache {
  districts: Map<string, District[]>;
  talukas: Map<number, Taluka[]>;
  ucsByTaluka: Map<number, UC[]>;
  ucsByName: Map<string, UC[]>;
}

@Injectable()
export class BulkFacilitiesService {
  private readonly logger: Logger = new Logger(BulkFacilitiesService.name);

  constructor(
    @InjectRepository(Facility)
    private readonly facilityRepository: Repository<Facility>,
    @InjectRepository(District)
    private readonly districtRepository: Repository<District>,
    @InjectRepository(Taluka)
    private readonly talukaRepository: Repository<Taluka>,
    @InjectRepository(UC)
    private readonly ucRepository: Repository<UC>,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  async createBulk(dto: BulkCreateFacilitiesDto) {
    try {
      const errors: BulkRowError[] = [];
      const rows = Array.isArray(dto?.facilities) ? dto.facilities : [];

      if (rows.length === 0) {
        throw this.bulkValidationError([
          { row: 0, field: '', message: 'at least one facility row is required' },
        ]);
      }

      const validatedRows = await this.validateRows(rows, errors);
      const cache = this.createGeographyCache();
      const prepared = await this.resolveGeography(validatedRows, cache, errors);

      this.detectWithinBatchDuplicates(prepared, errors);
      await this.detectExistingDuplicates(prepared, errors);

      if (errors.length > 0) {
        throw this.bulkValidationError(errors);
      }

      const created = await this.insertAll(prepared);
      await this.redisCacheService.deleteByPrefix('facilities:findAll');

      return successResponse(
        { created },
        ApiSuccessResponseMessages.FAC_BULK_CRT_SUCCESS,
        201
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(ApiResponseMessages.FAC_BULK_CRT_FAILED, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.FAC_BULK_CRT_FAILED,
      );
    }
  }

  private async validateRows(
    rows: BulkFacilityRowDto[],
    errors: BulkRowError[],
  ): Promise<{ instance: BulkFacilityRowDto; rowNumber: number }[]> {
    const valid: { instance: BulkFacilityRowDto; rowNumber: number }[] = [];

    for (let index = 0; index < rows.length; index++) {
      const rowNumber = index + 1;
      const raw = rows[index] as unknown;

      if (raw === null || typeof raw !== 'object') {
        errors.push({
          row: rowNumber,
          field: '',
          message: 'must be an object with facility fields',
        });
        continue;
      }

      const instance = plainToInstance(BulkFacilityRowDto, raw);
      const validationErrors: ValidationError[] = await validate(instance);

      if (validationErrors.length > 0) {
        errors.push(...mapValidationErrorsToRowErrors(validationErrors, rowNumber));
        continue;
      }

      valid.push({ instance, rowNumber });
    }

    return valid;
  }

  private createGeographyCache(): GeographyCache {
    return {
      districts: new Map(),
      talukas: new Map(),
      ucsByTaluka: new Map(),
      ucsByName: new Map(),
    };
  }

  private async resolveGeography(
    validatedRows: { instance: BulkFacilityRowDto; rowNumber: number }[],
    cache: GeographyCache,
    errors: BulkRowError[],
  ): Promise<PreparedFacilityRow[]> {
    const prepared: PreparedFacilityRow[] = [];

    for (const { instance, rowNumber } of validatedRows) {
      const districtResult = await this.resolveDistrict(
        instance.district,
        instance.division,
        cache,
      );
      if (!districtResult.ok) {
        errors.push({ row: rowNumber, ...districtResult });
        continue;
      }
      const district = districtResult.value;

      let taluka: Taluka | undefined;
      if (instance.taluka) {
        const talukaResult = await this.resolveTaluka(
          instance.taluka,
          district,
          cache,
        );
        if (!talukaResult.ok) {
          errors.push({ row: rowNumber, ...talukaResult });
          continue;
        }
        taluka = talukaResult.value;
      }

      let uc: UC | undefined;
      if (instance.union_council) {
        const ucResult = await this.resolveUnionCouncil(
          instance.union_council,
          taluka,
          cache,
        );
        if (!ucResult.ok) {
          errors.push({ row: rowNumber, ...ucResult });
          continue;
        }
        uc = ucResult.value;
      }

      prepared.push({
        rowNumber,
        name: instance.facility_name,
        code: instance.facility_code,
        district,
        uc,
        facility_type: instance.facility_type?.toUpperCase(),
        managed_by: instance.managed_by?.toUpperCase(),
        is_24_7: instance.is_24_7 ?? false,
        bmu: instance.bmu ?? false,
        otp: instance.otp ?? false,
        nsc: instance.nsc ?? false,
        lat: instance.lat,
        long: instance.long,
        level_of_care: instance.level_of_care,
      });
    }

    return prepared;
  }

  private async resolveDistrict(
    name: string,
    division: string | undefined,
    cache: GeographyCache,
  ): Promise<Resolution<District>> {
    const normalizedName = this.normalize(name);
    let matches = cache.districts.get(normalizedName);

    if (!matches) {
      matches = await this.districtRepository.find({
        where: {
          name: Raw(
            (alias) => `LOWER(TRIM(${alias})) = :districtName`,
            { districtName: normalizedName },
          ),
        },
        relations: ['division'],
      });
      cache.districts.set(normalizedName, matches);
    }

    if (matches.length === 0) {
      return {
        ok: false,
        field: 'district',
        message: `unknown district "${name}"`,
      };
    }

    if (matches.length === 1) {
      const district = matches[0];
      if (division && !this.namesMatch(district.division?.name, division)) {
        return {
          ok: false,
          field: 'district',
          message: `district "${name}" does not belong to division "${division}"`,
        };
      }
      return { ok: true, value: district };
    }

    // Several districts share this name — the division must disambiguate.
    if (!division) {
      return {
        ok: false,
        field: 'district',
        message: `multiple districts named "${name}" exist — specify the division`,
      };
    }

    const inDivision = matches.filter((district) =>
      this.namesMatch(district.division?.name, division),
    );

    if (inDivision.length === 0) {
      return {
        ok: false,
        field: 'district',
        message: `district "${name}" does not belong to division "${division}"`,
      };
    }
    if (inDivision.length > 1) {
      return {
        ok: false,
        field: 'district',
        message: `multiple districts named "${name}" exist in division "${division}"`,
      };
    }

    return { ok: true, value: inDivision[0] };
  }

  private async resolveTaluka(
    name: string,
    district: District,
    cache: GeographyCache,
  ): Promise<Resolution<Taluka>> {
    let talukas = cache.talukas.get(district.id);

    if (!talukas) {
      talukas = await this.talukaRepository.find({
        where: { district: { id: district.id } },
      });
      cache.talukas.set(district.id, talukas);
    }

    const taluka = talukas.find((candidate) =>
      this.namesMatch(candidate.name, name),
    );

    if (!taluka) {
      return {
        ok: false,
        field: 'taluka',
        message: `unknown taluka "${name}" in district "${district.name}"`,
      };
    }

    return { ok: true, value: taluka };
  }

  private async resolveUnionCouncil(
    name: string,
    taluka: Taluka | undefined,
    cache: GeographyCache,
  ): Promise<Resolution<UC>> {
    const normalizedName = this.normalize(name);

    if (taluka) {
      let ucs = cache.ucsByTaluka.get(taluka.id);
      if (!ucs) {
        ucs = await this.ucRepository.find({
          where: { taluka: { id: taluka.id } },
        });
        cache.ucsByTaluka.set(taluka.id, ucs);
      }

      const uc = ucs.find((candidate) => this.namesMatch(candidate.name, name));
      if (!uc) {
        return {
          ok: false,
          field: 'union_council',
          message: `unknown union council "${name}" in taluka "${taluka.name}"`,
        };
      }
      return { ok: true, value: uc };
    }

    // No taluka given: the union council name must resolve uniquely.
    let matches = cache.ucsByName.get(normalizedName);
    if (!matches) {
      matches = await this.ucRepository.find({
        where: {
          name: Raw((alias) => `LOWER(TRIM(${alias})) = :ucName`, {
            ucName: normalizedName,
          }),
        },
        relations: ['taluka'],
      });
      cache.ucsByName.set(normalizedName, matches);
    }

    if (matches.length === 0) {
      return {
        ok: false,
        field: 'union_council',
        message: `unknown union council "${name}"`,
      };
    }
    if (matches.length > 1) {
      return {
        ok: false,
        field: 'union_council',
        message: `multiple union councils named "${name}" exist — specify the taluka`,
      };
    }

    return { ok: true, value: matches[0] };
  }

  private detectWithinBatchDuplicates(
    prepared: PreparedFacilityRow[],
    errors: BulkRowError[],
  ): void {
    const codeOwners = new Map<number, number>();
    const nameOwners = new Map<string, number>();

    for (const row of prepared) {
      if (row.code !== undefined) {
        const owner = codeOwners.get(row.code);
        if (owner !== undefined) {
          errors.push({
            row: row.rowNumber,
            field: 'facility_code',
            message: `code ${row.code} is duplicated in this batch (first used in row ${owner})`,
          });
        } else {
          codeOwners.set(row.code, row.rowNumber);
        }
      }

      const nameKey = `${row.district.id}:${this.normalize(row.name)}`;
      const owner = nameOwners.get(nameKey);
      if (owner !== undefined) {
        errors.push({
          row: row.rowNumber,
          field: 'facility_name',
          message: `"${row.name}" is duplicated in this batch (first used in row ${owner})`,
        });
      } else {
        nameOwners.set(nameKey, row.rowNumber);
      }
    }
  }

  private async detectExistingDuplicates(
    prepared: PreparedFacilityRow[],
    errors: BulkRowError[],
  ): Promise<void> {
    if (prepared.length === 0) {
      return;
    }

    const codes = [
      ...new Set(
        prepared
          .map((row) => row.code)
          .filter((code): code is number => code !== undefined),
      ),
    ];

    if (codes.length > 0) {
      const existing = await this.facilityRepository.find({
        where: { code: In(codes) },
        select: { code: true },
      });
      const existingCodes = new Set(existing.map((row) => Number(row.code)));

      for (const row of prepared) {
        if (row.code !== undefined && existingCodes.has(Number(row.code))) {
          errors.push({
            row: row.rowNumber,
            field: 'facility_code',
            message: `facility code ${row.code} already exists`,
          });
        }
      }
    }

    const districtIds = [...new Set(prepared.map((row) => row.district.id))];
    const names = [...new Set(prepared.map((row) => this.normalize(row.name)))];

    const existingRows = await this.facilityRepository
      .createQueryBuilder('facility')
      .leftJoin('facility.district', 'district')
      .select(['facility.name AS name', 'district.id AS district_id'])
      .where('district.id IN (:...districtIds)', { districtIds })
      .andWhere('LOWER(TRIM(facility.name)) IN (:...names)', { names })
      .getRawMany<{ name: string; district_id: string }>();

    const existingKeys = new Set(
      existingRows.map(
        (row) => `${row.district_id}:${this.normalize(row.name)}`,
      ),
    );

    for (const row of prepared) {
      const key = `${row.district.id}:${this.normalize(row.name)}`;
      if (existingKeys.has(key)) {
        errors.push({
          row: row.rowNumber,
          field: 'facility_name',
          message: `a facility named "${row.name}" already exists in district "${row.district.name}"`,
        });
      }
    }
  }

  private async insertAll(rows: PreparedFacilityRow[]): Promise<number> {
    const entities = rows.map((row) =>
      this.facilityRepository.create({
        name: row.name,
        code: row.code,
        district: { id: row.district.id },
        uc: row.uc ? { id: row.uc.id } : undefined,
        facility_type: row.facility_type,
        managed_by: row.managed_by,
        is_24_7: row.is_24_7,
        bmu: row.bmu,
        otp: row.otp,
        nsc: row.nsc,
        lat: row.lat,
        long: row.long,
        level_of_care: row.level_of_care,
      }),
    );

    await this.facilityRepository.manager.transaction(async (manager) => {
      await manager.save(Facility, entities);
    });

    return entities.length;
  }

  private bulkValidationError(errors: BulkRowError[]): BadRequestException {
    return new BadRequestException({
      statusCode: 400,
      message: ApiResponseMessages.FAC_BULK_CRT_FAILED,
      errors,
    });
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private namesMatch(left: string | null | undefined, right: string): boolean {
    if (!left) return false;
    return this.normalize(left) === this.normalize(right);
  }
}
