import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as ExcelJS from 'exceljs';
import { join } from 'path';
import { Repository } from 'typeorm';
import { District } from 'src/districts/entities/district.entity';
import { Division } from 'src/division/entities/division.entity';
import { Province } from 'src/province/entities/province.entity';
import { Taluka } from 'src/taluka/entities/taluka.entity';
import { UC } from 'src/uc/entities/uc.entity';

type LocationCsvRow = {
  districtName: string;
  divisionName: string | null;
  provinceName: string | null;
  talukaName: string;
  ucName: string;
};

@Injectable()
export class LocationSeeder {
  constructor(
    @InjectRepository(Province)
    private readonly provinceRepository: Repository<Province>,
    @InjectRepository(Division)
    private readonly divisionRepository: Repository<Division>,
    @InjectRepository(District)
    private readonly districtRepository: Repository<District>,
    @InjectRepository(Taluka)
    private readonly talukaRepository: Repository<Taluka>,
    @InjectRepository(UC)
    private readonly ucRepository: Repository<UC>,
  ) {}

  async seed() {
    const filePath = join(
      __dirname,
      '..',
      '..',
      '..',
      'storage',
      'updated UC, taluka, district, division and province.csv',
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = await workbook.csv.readFile(filePath);

    if (!worksheet) {
      throw new Error('Location CSV worksheet not found.');
    }

    const rows = this.getRows(worksheet);

    const provinces = await this.provinceRepository.find();
    const divisions = await this.divisionRepository.find({
      relations: ['province'],
    });
    const districts = await this.districtRepository.find({
      relations: ['division'],
    });
    const talukas = await this.talukaRepository.find({
      relations: ['district'],
    });
    const ucs = await this.ucRepository.find({
      relations: ['taluka'],
    });

    const provinceByName = new Map(
      provinces.map((province) => [this.normalizeKey(province.name), province]),
    );
    const divisionByName = new Map(
      divisions.map((division) => [this.normalizeKey(division.name), division]),
    );
    const districtsByName = new Map<string, District[]>();
    const districtByScope = new Map<string, District>();
    const talukasByName = new Map<string, Taluka[]>();
    const talukaByScope = new Map<string, Taluka>();
    const ucsByName = new Map<string, UC[]>();
    const ucByScope = new Map<string, UC>();

    for (const district of districts) {
      const nameKey = this.normalizeKey(district.name);
      districtsByName.set(nameKey, [
        ...(districtsByName.get(nameKey) ?? []),
        district,
      ]);
      districtByScope.set(
        this.scopeKey(district.division?.id ?? null, district.name),
        district,
      );
    }

    for (const taluka of talukas) {
      const nameKey = this.normalizeKey(taluka.name);
      talukasByName.set(nameKey, [...(talukasByName.get(nameKey) ?? []), taluka]);
      talukaByScope.set(
        this.scopeKey(taluka.district?.id ?? null, taluka.name),
        taluka,
      );
    }

    for (const uc of ucs) {
      const nameKey = this.normalizeKey(uc.name);
      ucsByName.set(nameKey, [...(ucsByName.get(nameKey) ?? []), uc]);
      ucByScope.set(this.scopeKey(uc.taluka?.id ?? null, uc.name), uc);
    }

    for (const row of rows) {
      const province = row.provinceName
        ? await this.getOrCreateProvince(row.provinceName, provinceByName)
        : null;
      const division = row.divisionName
        ? await this.getOrCreateDivision(
            row.divisionName,
            province,
            divisionByName,
          )
        : null;
      const district = await this.getOrCreateDistrict(
        row.districtName,
        division,
        districtsByName,
        districtByScope,
      );
      const taluka = await this.getOrCreateTaluka(
        row.talukaName,
        district,
        talukasByName,
        talukaByScope,
      );

      await this.getOrCreateUc(row.ucName, taluka, ucsByName, ucByScope);
    }

    console.log('Location seeding completed successfully.');
  }

  private getRows(worksheet: ExcelJS.Worksheet): LocationCsvRow[] {
    const rows: LocationCsvRow[] = [];

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
      const row = worksheet.getRow(rowNumber);
      const ucName = this.getCellValue(row.getCell(1).value);
      const talukaName = this.getCellValue(row.getCell(2).value);
      const districtName = this.getCellValue(row.getCell(3).value);
      const divisionName = this.getCellValue(row.getCell(4).value) || null;
      const provinceName = this.getCellValue(row.getCell(5).value) || null;

      if (!districtName || !talukaName || !ucName) {
        continue;
      }

      if (talukaName === '-' || ucName === '-') {
        continue;
      }

      rows.push({
        districtName,
        divisionName,
        provinceName,
        talukaName,
        ucName,
      });
    }

    return rows;
  }

  private async getOrCreateProvince(
    provinceName: string,
    provinceByName: Map<string, Province>,
  ): Promise<Province> {
    const key = this.normalizeKey(provinceName);
    const existingProvince = provinceByName.get(key);
    if (existingProvince) {
      return existingProvince;
    }

    const province = await this.provinceRepository.save(
      this.provinceRepository.create({ name: provinceName }),
    );
    provinceByName.set(key, province);
    return province;
  }

  private async getOrCreateDivision(
    divisionName: string,
    province: Province | null,
    divisionByName: Map<string, Division>,
  ): Promise<Division> {
    const key = this.normalizeKey(divisionName);
    const existingDivision = divisionByName.get(key);

    if (existingDivision) {
      if (
        province &&
        (!existingDivision.province ||
          existingDivision.province.id !== province.id)
      ) {
        existingDivision.province = province;
        const savedDivision = await this.divisionRepository.save(existingDivision);
        divisionByName.set(key, savedDivision);
        return savedDivision;
      }

      return existingDivision;
    }

    const division = await this.divisionRepository.save(
      this.divisionRepository.create(
        province
          ? {
              name: divisionName,
              province,
            }
          : {
              name: divisionName,
            },
      ),
    );

    divisionByName.set(key, division);
    return division;
  }

  private async getOrCreateDistrict(
    districtName: string,
    division: Division | null,
    districtsByName: Map<string, District[]>,
    districtByScope: Map<string, District>,
  ): Promise<District> {
    const scopedKey = this.scopeKey(division?.id ?? null, districtName);
    const scopedDistrict = districtByScope.get(scopedKey);
    if (scopedDistrict) {
      return scopedDistrict;
    }

    const nameKey = this.normalizeKey(districtName);
    const candidates = districtsByName.get(nameKey) ?? [];
    let district: District | undefined;

    if (division) {
      district =
        candidates.find((candidate) => candidate.division?.id === division.id) ??
        candidates.find((candidate) => !candidate.division);
    } else {
      district =
        candidates.find((candidate) => !candidate.division) ?? candidates[0];
    }

    const districtHasDivision = Boolean(district?.division?.id);

    if (district && division && !districtHasDivision) {
      const previousScopeKey = this.scopeKey(
        district.division?.id ?? null,
        district.name,
      );
      district.division = division;
      const updatedDistrict = await this.districtRepository.save(district);
      districtsByName.set(
        nameKey,
        candidates.map((candidate) =>
          candidate.id === updatedDistrict.id ? updatedDistrict : candidate,
        ),
      );
      districtByScope.delete(previousScopeKey);
      district = updatedDistrict;
    }

    if (!district) {
      district = await this.districtRepository.save(
        this.districtRepository.create(
          division
            ? {
                name: districtName,
                division,
              }
            : {
                name: districtName,
              },
        ),
      );
      districtsByName.set(nameKey, [...candidates, district]);
    }

    districtByScope.set(
      this.scopeKey(district.division?.id ?? null, district.name),
      district,
    );
    districtByScope.set(scopedKey, district);

    return district;
  }

  private async getOrCreateTaluka(
    talukaName: string,
    district: District,
    talukasByName: Map<string, Taluka[]>,
    talukaByScope: Map<string, Taluka>,
  ): Promise<Taluka> {
    const scopedKey = this.scopeKey(district.id, talukaName);
    const scopedTaluka = talukaByScope.get(scopedKey);
    if (scopedTaluka) {
      return scopedTaluka;
    }

    const nameKey = this.normalizeKey(talukaName);
    const candidates = talukasByName.get(nameKey) ?? [];
    let taluka =
      candidates.find((candidate) => candidate.district?.id === district.id) ??
      candidates.find((candidate) => !candidate.district);

    if (taluka && !taluka.district) {
      taluka.district = district;
      taluka = await this.talukaRepository.save(taluka);
    }

    if (!taluka) {
      taluka = await this.talukaRepository.save(
        this.talukaRepository.create({
          name: talukaName,
          district,
        }),
      );
      talukasByName.set(nameKey, [...candidates, taluka]);
    }

    talukaByScope.set(this.scopeKey(taluka.district?.id ?? null, taluka.name), taluka);
    talukaByScope.set(scopedKey, taluka);

    return taluka;
  }

  private async getOrCreateUc(
    ucName: string,
    taluka: Taluka,
    ucsByName: Map<string, UC[]>,
    ucByScope: Map<string, UC>,
  ): Promise<UC> {
    const scopedKey = this.scopeKey(taluka.id, ucName);
    const scopedUc = ucByScope.get(scopedKey);
    if (scopedUc) {
      return scopedUc;
    }

    const nameKey = this.normalizeKey(ucName);
    const candidates = ucsByName.get(nameKey) ?? [];
    let uc =
      candidates.find((candidate) => candidate.taluka?.id === taluka.id) ??
      candidates.find((candidate) => !candidate.taluka);

    if (uc && !uc.taluka) {
      uc.taluka = taluka;
      uc = await this.ucRepository.save(uc);
    }

    if (!uc) {
      uc = await this.ucRepository.save(
        this.ucRepository.create({
          name: ucName,
          taluka,
        }),
      );
      ucsByName.set(nameKey, [...candidates, uc]);
    }

    ucByScope.set(this.scopeKey(uc.taluka?.id ?? null, uc.name), uc);
    ucByScope.set(scopedKey, uc);

    return uc;
  }

  private getCellValue(value: ExcelJS.CellValue | null | undefined): string {
    if (typeof value === 'string') {
      return value.trim();
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value).trim();
    }

    if (value && typeof value === 'object' && 'text' in value) {
      return String(value.text ?? '').trim();
    }

    return '';
  }

  private normalizeKey(value: string): string {
    return value.trim().toLowerCase();
  }

  private scopeKey(parentId: number | null, name: string): string {
    return `${parentId ?? 'null'}:${this.normalizeKey(name)}`;
  }
}
