import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { join } from 'path';
import { District } from 'src/districts/entities/district.entity';
import { Division } from 'src/division/entities/division.entity';

@Injectable()
export class DistrictSeeder {
  constructor(
    @InjectRepository(District)
    private readonly districtRepository: Repository<District>,
    @InjectRepository(Division)
    private readonly divisionRepository: Repository<Division>,
  ) {}

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

    const divisionCache = new Map<string, Division>();
    const districtCache = new Map<string, District>();

    for (const row of worksheet.getSheetValues()) {
      const divisionNameRaw = row?.[1];
      const districtNameRaw = row?.[3];
      if (
        typeof divisionNameRaw !== 'string' ||
        typeof districtNameRaw !== 'string'
      ) {
        continue;
      }

      const divisionName = divisionNameRaw.trim();
      const districtName = districtNameRaw.trim();
      if (!divisionName || !districtName) continue;
      if (
        divisionName.toLowerCase() === 'division' ||
        districtName.toLowerCase() === 'district'
      ) {
        continue;
      }

      const divisionKey = divisionName.toLowerCase();
      let division: Division | null | undefined = divisionCache.get(divisionKey);
      if (!division) {
        division = await this.divisionRepository.findOne({
          where: { name: divisionName },
        });
        if (!division) {
          division = this.divisionRepository.create({ name: divisionName });
          division = await this.divisionRepository.save(division);
        }
        divisionCache.set(divisionKey, division);
      }

      const districtKey = `${division.id}:${districtName.toLowerCase()}`;
      if (districtCache.has(districtKey)) continue;

      let district = await this.districtRepository.findOne({
        where: { name: districtName, division: { id: division.id } },
        relations: ['division'],
      });

      if (!district) {
        const districtByName = await this.districtRepository.findOne({
          where: { name: districtName },
          relations: ['division'],
        });

        if (!districtByName) {
          district = this.districtRepository.create({
            name: districtName,
            division,
          });
          district = await this.districtRepository.save(district);
        } else if (!districtByName.division) {
          districtByName.division = division;
          district = await this.districtRepository.save(districtByName);
        } else if (districtByName.division.id === division.id) {
          district = districtByName;
        } else {
          district = this.districtRepository.create({
            name: districtName,
            division,
          });
          district = await this.districtRepository.save(district);
        }
      }

      districtCache.set(districtKey, district);
    }

    console.log('✅ District seeding completed successfully!');
  }
}
