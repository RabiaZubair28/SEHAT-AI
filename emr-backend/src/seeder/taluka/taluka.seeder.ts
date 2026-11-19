import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { join } from 'path';
import { Taluka } from 'src/taluka/entities/taluka.entity';
import { District } from 'src/districts/entities/district.entity';
import { Division } from 'src/division/entities/division.entity';

@Injectable()
export class TalukaSeeder {
  constructor(
    @InjectRepository(Taluka)
    private readonly talukaRepository: Repository<Taluka>,
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
    const talukaCache = new Map<string, Taluka>();

    for (const row of worksheet.getSheetValues()) {
      const divisionNameRaw = row?.[1];
      const districtNameRaw = row?.[3];
      const talukaNameRaw = row?.[4];

      if (
        typeof divisionNameRaw !== 'string' ||
        typeof districtNameRaw !== 'string' ||
        typeof talukaNameRaw !== 'string'
      ) {
        continue;
      }

      const divisionName = divisionNameRaw.trim();
      const districtName = districtNameRaw.trim();
      const talukaName = talukaNameRaw.trim();
      if (!divisionName || !districtName || !talukaName) continue;
      if (talukaName === '-') continue;
      if (
        divisionName.toLowerCase() === 'division' ||
        districtName.toLowerCase() === 'district' ||
        talukaName.toLowerCase() === 'taluka'
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
      let district: District | null | undefined = districtCache.get(districtKey);
      if (!district) {
        district = await this.districtRepository.findOne({
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

      const talukaKey = `${district.id}:${talukaName.toLowerCase()}`;
      if (talukaCache.has(talukaKey)) continue;

      let taluka = await this.talukaRepository.findOne({
        where: { name: talukaName, district: { id: district.id } },
        relations: ['district'],
      });

      if (!taluka) {
        const talukaByName = await this.talukaRepository.findOne({
          where: { name: talukaName },
          relations: ['district'],
        });

        if (!talukaByName) {
          taluka = this.talukaRepository.create({ name: talukaName, district });
          taluka = await this.talukaRepository.save(taluka);
        } else if (!talukaByName.district) {
          talukaByName.district = district;
          taluka = await this.talukaRepository.save(talukaByName);
        } else if (talukaByName.district.id === district.id) {
          taluka = talukaByName;
        } else {
          taluka = this.talukaRepository.create({ name: talukaName, district });
          taluka = await this.talukaRepository.save(taluka);
        }
      }

      talukaCache.set(talukaKey, taluka);
    }

    console.log(
      '✅ Taluka seeding completed successfully!',
    );
  }
}
