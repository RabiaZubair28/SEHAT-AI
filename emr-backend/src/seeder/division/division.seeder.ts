import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { join } from 'path';
import { Division } from 'src/division/entities/division.entity';

@Injectable()
export class DivisionSeeder {
  constructor(
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

    const divisionsMap = new Map<string, Division>();
    const existingDivisions = await this.divisionRepository.find();
    for (const division of existingDivisions) {
      if (!division.name) continue;
      divisionsMap.set(division.name.trim().toLowerCase(), division);
    }

    for (const row of worksheet.getSheetValues()) {
      const divisionNameRaw = row?.[1];
      if (typeof divisionNameRaw !== 'string') continue;

      const divisionName = divisionNameRaw.trim();
      if (!divisionName || divisionName.toLowerCase() === 'division') continue;

      const normalizedName = divisionName.toLowerCase();
      if (divisionsMap.has(normalizedName)) continue;

      const division = this.divisionRepository.create({ name: divisionName });
      const savedDivision = await this.divisionRepository.save(division);
      divisionsMap.set(normalizedName, savedDivision);
    }

    console.log('✅ Division seeding completed successfully!');
  }
}
