import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, IsNull } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { join } from 'path';
import { Facility } from 'src/facilities/entities/facility.entity';
import { District } from 'src/districts/entities/district.entity';
import { UC } from 'src/uc/entities/uc.entity';

@Injectable()
export class FacilitySeeder {
  constructor(
    @InjectRepository(Facility)
    private readonly facilityRepository: Repository<Facility>,
    @InjectRepository(District)
    private readonly districtRepository: Repository<District>,
    @InjectRepository(UC)
    private readonly ucRepository: Repository<UC>,
  ) { }

  private excelBool(value: unknown): boolean {
    if (value === null || value === undefined) return false;

    const str = String(value).trim().toLowerCase();
    if (str === 'true' || str === '1' || str === 'yes' || str === 'y') return true;
    if (str === 'false' || str === '0' || str === 'no' || str === 'n') return false;
    return false;
  }

  private isMissing(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    return false;
  }

  private toOptionalUpper(value: unknown): string | undefined {
    if (value === null || value === undefined) return undefined;
    const str = String(value).trim();
    return str ? str.toUpperCase() : undefined;
  }

  private toOptionalNumber(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  private normalizeText(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private getFacilityCacheKey(
    facilityCode: number | undefined,
    facilityName: string | null,
  ): string | null {
    if (!facilityName) return null;
    const normalizedName = this.normalizeText(facilityName);

    if (facilityCode !== undefined) {
      return `code_${facilityCode}:name_${normalizedName}`;
    }
    return `code_null:name_${normalizedName}`;
  }

  async seed() {
    const filePath = join(
      __dirname,
      '..',
      '..',
      '..',
      'storage',
      'List of facilities, UC,taluka, district and division for EMR.xlsx',
    );
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      throw new Error('Worksheet not found!');
    }

    const districtCache = new Map<string, District>();
    const ucCache = new Map<string, UC | null>();
    const facilityCache = new Map<string, Facility>();

    const rows = worksheet.getSheetValues();

    for (const row of rows) {
      if (!row) continue;

      const facilityCodeRaw = row?.[2];
      const districtNameRaw = row?.[3];
      const talukaNameRaw = row?.[4];
      const ucNameRaw = row?.[5];
      const facilityNameRaw = row?.[6];
      const facilityTypeRaw = row?.[7];
      const managedByRaw = row?.[8];
      const is24_7Raw = row?.[9];
      const bmuRaw = row?.[10];
      const otpRaw = row?.[11];
      const nscRaw = row?.[12];
      const latRaw = row?.[13];
      const longRaw = row?.[14];
      const levelOfCareRaw = row?.[15];

      const facilityCode = this.toOptionalNumber(facilityCodeRaw);
      const facilityName = typeof facilityNameRaw === 'string' ? facilityNameRaw.trim() : null;

      if (!facilityName) continue;

      const districtName = typeof districtNameRaw === 'string' ? districtNameRaw.trim() : '';
      if (!districtName) continue;

      let district: District | null | undefined = districtCache.get(
        districtName.toLowerCase(),
      );
      if (!district) {
        district = await this.districtRepository.findOne({
          where: { name: districtName },
        });
        if (!district) continue;
        districtCache.set(districtName.toLowerCase(), district);
      }

      const talukaName = typeof talukaNameRaw === 'string' ? talukaNameRaw.trim() : '';
      const ucName = typeof ucNameRaw === 'string' ? ucNameRaw.trim() : '';
      const ucKey = `${districtName.toLowerCase()}:${talukaName.toLowerCase()}:${ucName.toLowerCase()}`;
      let uc: UC | null = ucCache.get(ucKey) ?? null;

      if (!ucCache.has(ucKey)) {
        if (ucName && talukaName) {
          uc = await this.ucRepository.findOne({
            where: {
              name: ucName,
              taluka: { name: talukaName, district: { name: districtName } },
            },
            relations: ['taluka', 'taluka.district'],
          });

          if (!uc) {
            uc = await this.ucRepository.findOne({
              where: { name: ucName, taluka: { name: talukaName } },
              relations: ['taluka'],
            });
          }

          if (!uc) {
            uc = await this.ucRepository.findOne({
              where: { name: ucName },
            });
          }
        }
        ucCache.set(ucKey, uc);
      }

      const cacheKey = this.getFacilityCacheKey(facilityCode, facilityName);
      let facility: Facility | null | undefined = cacheKey ? facilityCache.get(cacheKey) : null;

      if (!facility) {
        if (facilityCode !== undefined) {
          facility = await this.facilityRepository.findOne({
            where: {
              code: facilityCode,
              name: ILike(facilityName)
            },
            relations: ['district', 'uc'],
          });
        } else {
          facility = await this.facilityRepository.findOne({
            where: {
              name: ILike(facilityName),
              code: IsNull()
            },
            relations: ['district', 'uc'],
          });
        }
      }

      const facilityType = this.toOptionalUpper(facilityTypeRaw);
      const managedBy = this.toOptionalUpper(managedByRaw);
      const lat = this.toOptionalNumber(latRaw);
      const long = this.toOptionalNumber(longRaw);

      if (!facility) {
        facility = this.facilityRepository.create({
          name: facilityName,
          code: facilityCode,
          district,
          uc: uc ?? undefined,
          facility_type: facilityType,
          managed_by: managedBy,
          is_24_7: this.excelBool(is24_7Raw),
          bmu: this.excelBool(bmuRaw),
          otp: this.excelBool(otpRaw),
          nsc: this.excelBool(nscRaw),
          lat,
          long,
          level_of_care: (levelOfCareRaw as Facility['level_of_care'] | null) ?? undefined,
        });
        facility = await this.facilityRepository.save(facility);
        if (cacheKey) {
          facilityCache.set(cacheKey, facility);
        }
        continue;
      }

      let hasChanges = false;

      const existingDistrictId =
        facility.district?.id ??
        (facility as any).districtId ??
        (facility as any).district_id;

      if (district && existingDistrictId !== district.id) {
        facility.district = district;
        (facility as any).districtId = district.id;
        (facility as any).district_id = district.id;
        hasChanges = true;
      }

      const existingUcId =
        facility.uc?.id ??
        facility.uc_id ??
        (facility as any).ucId ??
        (facility as any).uc_id;

      if (uc && existingUcId !== uc.id) {
        facility.uc = uc;
        facility.uc_id = uc.id;
        (facility as any).ucId = uc.id;
        (facility as any).uc_id = uc.id;
        hasChanges = true;
      } else if (!uc && existingUcId !== undefined && existingUcId !== null) {
        facility.uc = null as any;
        facility.uc_id = null as any;
        (facility as any).ucId = null as any;
        (facility as any).uc_id = null as any;
        hasChanges = true;
      }

      if (facilityType && facility.facility_type !== facilityType) {
        facility.facility_type = facilityType;
        hasChanges = true;
      }
      if (managedBy && facility.managed_by !== managedBy) {
        facility.managed_by = managedBy;
        hasChanges = true;
      }
      const is24_7 = this.excelBool(is24_7Raw);
      if (facility.is_24_7 !== is24_7) {
        facility.is_24_7 = is24_7;
        hasChanges = true;
      }
      const bmu = this.excelBool(bmuRaw);
      if (facility.bmu !== bmu) {
        facility.bmu = bmu;
        hasChanges = true;
      }
      const otp = this.excelBool(otpRaw);
      if (facility.otp !== otp) {
        facility.otp = otp;
        hasChanges = true;
      }
      const nsc = this.excelBool(nscRaw);
      if (facility.nsc !== nsc) {
        facility.nsc = nsc;
        hasChanges = true;
      }
      if (lat !== undefined && facility.lat !== lat) {
        facility.lat = lat;
        hasChanges = true;
      }
      if (long !== undefined && facility.long !== long) {
        facility.long = long;
        hasChanges = true;
      }
      if (
        !this.isMissing(levelOfCareRaw) &&
        facility.level_of_care !== levelOfCareRaw
      ) {
        facility.level_of_care = levelOfCareRaw as Facility['level_of_care'];
        hasChanges = true;
      }
      
      if (hasChanges) {
        facility = await this.facilityRepository.save(facility);
      }
      if (cacheKey) {
        facilityCache.set(cacheKey, facility);
      }
    }

    console.log('✅ Facility seeding completed successfully!');
  }
}
