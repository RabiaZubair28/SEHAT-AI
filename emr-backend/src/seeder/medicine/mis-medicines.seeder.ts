import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { join } from 'path';
import { MedicineUnit } from 'src/common/enums/enums';
import { MedicineVariant } from 'src/medicine/entities/medicine-variant.entity';
import { Medicine } from 'src/medicine/entities/medicine.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class MisMedicinesSeeder {
  constructor(
    private readonly dataSource: DataSource,
  ) {}

  async seed() {
    const filePath = join(
      __dirname,
      '..',
      '..',
      '..',
      'storage',
      'CRC compiled MIS.xlsx',
    );

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.getWorksheet('Sheet1') || workbook.worksheets[0];

    if (!worksheet) {
      console.warn('No worksheet found for MIS medicine seeding.');
      return;
    }

    await this.dataSource.transaction(async (manager) => {
      const medicineRepository = manager.getRepository(Medicine);
      const variantRepository = manager.getRepository(MedicineVariant);
      await this.seedMedicines(worksheet, medicineRepository, variantRepository);
    });

    console.log('MIS medicines seeding completed.');
  }

  private mapMedicineUnit(form?: any): MedicineUnit {
    const normalized = String(form || '')
      .trim()
      .toLowerCase();

    if (!normalized) {
      return MedicineUnit.TABLET;
    }

    if (normalized.includes('tablet') || normalized.includes('tab')) {
      return MedicineUnit.TABLET;
    }

    if (normalized.includes('capsule') || normalized.includes('cap')) {
      return MedicineUnit.CAPSULE;
    }

    if (normalized.includes('sachet') || normalized.includes('sach')) {
      return MedicineUnit.SACHET;
    }

    if (normalized.includes('syrup')) {
      return MedicineUnit.SYRUP;
    }

    if (normalized.includes('injection') || normalized.includes('inj')) {
      return MedicineUnit.INJECTION;
    }

    if (normalized.includes('i.v') || normalized.includes('iv')) {
      return MedicineUnit.IV_INFUSION;
    }

    if (normalized.includes('nebulizer') || normalized.includes('nebule')) {
      return MedicineUnit.NEBULES;
    }

    if (
      normalized.includes('cream') ||
      normalized.includes('ointment') ||
      normalized.includes('gel') ||
      normalized.includes('lotion') ||
      normalized.includes('paste') ||
      normalized.includes('jelly')
    ) {
      return MedicineUnit.CREAM;
    }

    if (normalized.includes('imp')) {
      return MedicineUnit.IMPLANT;
    }

    if (
      normalized.includes('drop') ||
      normalized.includes('susp') ||
      normalized.includes('sol') ||
      normalized.includes('liq') ||
      normalized.includes('oral')
    ) {
      return MedicineUnit.BOTTLE;
    }

    return MedicineUnit.TABLET;
  }

  private splitStrengths(raw: any): string[] {
    const value = String(raw || '').replace(/\s+/g, ' ').trim();
    if (!value) {
      return [];
    }

    const segments = value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const results: string[] = [];
    for (const segment of segments) {
      results.push(...this.splitStrengthSegment(segment));
    }

    return results.filter(Boolean);
  }

  private splitStrengthSegment(segment: string): string[] {
    if (!segment.includes('/')) {
      return [segment];
    }

    const compact = segment.replace(/\s*\/\s*/g, '/');
    const parts = compact
      .split('/')
      .map((p) => p.trim())
      .filter(Boolean);
    if (!parts.length) {
      return [];
    }

    const lastPart = parts[parts.length - 1];
    const suffixMatch = lastPart.match(/^[\d.,+-]+\s*(.*)$/);
    const suffix = suffixMatch ? suffixMatch[1].trim() : '';

    return parts.map((part, index) => {
      if (index === parts.length - 1 || !suffix) {
        return part;
      }

      const numberMatch = part.match(/^[\d.,+-]+/);
      const numberPortion = numberMatch ? numberMatch[0] : part;
      return `${numberPortion} ${suffix}`.trim();
    });
  }

  private async seedMedicines(
    sheet: ExcelJS.Worksheet,
    medicineRepository: Repository<Medicine>,
    variantRepository: Repository<MedicineVariant>,
  ): Promise<void> {
    for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex++) {
      const row = sheet.getRow(rowIndex);
      const medicineName = String(row.getCell(10).value || '').trim();

      if (!medicineName) {
        continue;
      }

      const itemCode = String(row.getCell(1).value || '').trim();
      const itemName = String(row.getCell(2).value || '').trim();
      const crcList = String(row.getCell(7).value || '').trim();
      const form = row.getCell(8).value;
      const dosage = row.getCell(9).value;

      let medicine = await medicineRepository.findOne({
        where: { name: medicineName },
      });

      if (!medicine) {
        medicine = medicineRepository.create({
          name: medicineName,
          generic_name: medicineName,
          category: crcList || 'MIS',
          description: itemCode
            ? `Seeded from MIS (${itemCode})${itemName ? `: ${itemName}` : ''}`
            : `Seeded from MIS${itemName ? `: ${itemName}` : ''}`,
          contraceptive: false,
        });
      } else {
        medicine.generic_name = medicine.generic_name || medicineName;
        medicine.category = medicine.category || crcList || 'MIS';
        medicine.contraceptive = false;
      }

      medicine = await medicineRepository.save(medicine);

      const unit = this.mapMedicineUnit(form);
      const strengths = this.splitStrengths(dosage);
      const strengthsToUse = strengths.length ? strengths : ['N/A'];
      const variantKeys = new Set<string>();
      const variantsToSave: MedicineVariant[] = [];

      for (const strength of strengthsToUse) {
        const key = `${unit}-${strength}`;
        if (variantKeys.has(key)) {
          continue;
        }
        variantKeys.add(key);

        const existingVariant = await variantRepository.findOne({
          where: {
            medicine: { id: medicine.id },
            unit,
            strength,
          },
          relations: ['medicine'],
        });

        if (!existingVariant) {
          variantsToSave.push(
            variantRepository.create({
              medicine,
              unit,
              strength,
            }),
          );
        }
      }

      if (variantsToSave.length) {
        await variantRepository.save(variantsToSave);
      }
    }
  }
}
