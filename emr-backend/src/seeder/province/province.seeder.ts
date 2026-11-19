import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as ExcelJS from 'exceljs';
import { join } from 'path';
import { Repository } from 'typeorm';
import { Province } from 'src/province/entities/province.entity';

@Injectable()
export class ProvinceSeeder {
  constructor(
    @InjectRepository(Province)
    private readonly provinceRepository: Repository<Province>,
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
      throw new Error('Province CSV worksheet not found.');
    }

    const existingProvinces = await this.provinceRepository.find();
    const provinceByName = new Map(
      existingProvinces.map((province) => [
        province.name.trim().toLowerCase(),
        province,
      ]),
    );

    const provinceNames = new Set<string>();
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
      const provinceName = worksheet.getRow(rowNumber).getCell(5).text.trim();
      if (!provinceName) {
        continue;
      }

      provinceNames.add(provinceName);
    }

    const orderedProvinceNames = [...provinceNames].sort((left, right) => {
      if (left.toLowerCase() === 'sindh') return -1;
      if (right.toLowerCase() === 'sindh') return 1;
      return left.localeCompare(right);
    });

    for (const provinceName of orderedProvinceNames) {
      const key = provinceName.trim().toLowerCase();
      if (provinceByName.has(key)) {
        continue;
      }

      const province = await this.provinceRepository.save(
        this.provinceRepository.create({ name: provinceName }),
      );
      provinceByName.set(key, province);
    }

    console.log('Province seeding completed successfully.');
  }
}
