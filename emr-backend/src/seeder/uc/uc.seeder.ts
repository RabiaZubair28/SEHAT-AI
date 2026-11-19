import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { join } from 'path';
import { UC } from 'src/uc/entities/uc.entity';
import { Taluka } from 'src/taluka/entities/taluka.entity';

@Injectable()
export class UcSeeder {
  constructor(
    @InjectRepository(UC)
    private readonly ucRepository: Repository<UC>,
    @InjectRepository(Taluka)
    private readonly talukaRepository: Repository<Taluka>,
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

    const talukaCache = new Map<string, Taluka>();
    const ucCache = new Map<string, UC>();

    for (const row of worksheet.getSheetValues()) {
      const districtNameRaw = row?.[3];
      const talukaNameRaw = row?.[4];
      const ucNameRaw = row?.[5];

      if (
        typeof districtNameRaw !== 'string' ||
        typeof talukaNameRaw !== 'string' ||
        typeof ucNameRaw !== 'string'
      ) {
        continue;
      }

      const districtName = districtNameRaw.trim();
      const talukaName = talukaNameRaw.trim();
      const ucName = ucNameRaw.trim();
      if (!districtName || !talukaName || !ucName) continue;
      if (ucName === '-') continue;
      if (
        districtName.toLowerCase() === 'district' ||
        talukaName.toLowerCase() === 'taluka' ||
        ucName.toLowerCase() === 'union council'
      ) {
        continue;
      }

      const talukaKey = `${districtName.toLowerCase()}:${talukaName.toLowerCase()}`;
      let taluka: Taluka | null | undefined = talukaCache.get(talukaKey);
      if (!taluka) {
        taluka = await this.talukaRepository.findOne({
          where: { name: talukaName, district: { name: districtName } },
          relations: ['district'],
        });

        if (!taluka) {
          taluka = await this.talukaRepository.findOne({
            where: { name: talukaName },
            relations: ['district'],
          });
        }

        if (!taluka) {
          console.log(`Taluka not found for UC: ${ucName} | Taluka: ${talukaName}`);
          continue;
        }

        talukaCache.set(talukaKey, taluka);
      }

      const ucKey = `${taluka.id}:${ucName.toLowerCase()}`;
      if (ucCache.has(ucKey)) continue;

      let uc = await this.ucRepository.findOne({
        where: { name: ucName, taluka: { id: taluka.id } },
        relations: ['taluka'],
      });

      if (!uc) {
        const ucByName = await this.ucRepository.findOne({
          where: { name: ucName },
          relations: ['taluka'],
        });

        if (!ucByName) {
          uc = this.ucRepository.create({ name: ucName, taluka });
          uc = await this.ucRepository.save(uc);
        } else if (!ucByName.taluka) {
          ucByName.taluka = taluka;
          uc = await this.ucRepository.save(ucByName);
        } else if (ucByName.taluka.id === taluka.id) {
          uc = ucByName;
        } else {
          uc = this.ucRepository.create({ name: ucName, taluka });
          uc = await this.ucRepository.save(uc);
        }
      }

      ucCache.set(ucKey, uc);
    }

    console.log('✅ UC seeding completed successfully!');
  }
}
