import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as ExcelJS from 'exceljs';
import { join } from 'path';
import { Repository } from 'typeorm';
import {
  MedicineStatus,
  MedicineUnit,
} from 'src/common/enums/enums';
import { Facility } from 'src/facilities/entities/facility.entity';
import { MedicineBatch } from 'src/medicine/entities/medicine-batch.entity';
import { MedicineVariant } from 'src/medicine/entities/medicine-variant.entity';
import { Medicine } from 'src/medicine/entities/medicine.entity';
import { User } from 'src/users/entities/user.entity';
import { MedicineCount } from 'src/medicine-batch/entities/medicine-count.entity';


@Injectable()
export class MedicineSeeder {
  constructor(
    @InjectRepository(Medicine)
    private readonly medicineRepository: Repository<Medicine>,
    @InjectRepository(MedicineVariant)
    private readonly variantRepository: Repository<MedicineVariant>,
    @InjectRepository(MedicineBatch)
    private readonly batchRepository: Repository<MedicineBatch>,
    @InjectRepository(Facility)
    private readonly facilityRepository: Repository<Facility>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(MedicineCount)
    private readonly medicineCountRepository: Repository<MedicineCount>,
  ) { }

  async seed() {
    const filePath = join(
      __dirname,
      '..',
      '..',
      '..',
      'storage',
      'medicines list.xlsx',
    );

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const medicinesSheet = workbook.getWorksheet('Medicines');
    const contraceptivesSheet = workbook.getWorksheet('Contraceptives');

    const facility =
      (await this.facilityRepository.find({ order: { id: 'ASC' }, take: 1 }))[
      0
      ] || null;

    const createdBy =
      (await this.userRepository.findOne({
        where: { email: 'super@emr.com' },
      })) ||
      (await this.userRepository.find({ order: { id: 'ASC' }, take: 1 }))[0];

    if (!medicinesSheet && !contraceptivesSheet) {
      console.warn('No worksheets found for medicine seeding.');
      return;
    }

    if (medicinesSheet) {
      await this.seedMedicines(medicinesSheet, facility, createdBy);
    }

    if (contraceptivesSheet) {
      await this.seedContraceptives(contraceptivesSheet, facility, createdBy);
    }

    console.log('✅ Medicine seeding completed!');
  }

  private parseBoolean(value: any): boolean {
    if (value === null || value === undefined) {
      return false;
    }

    const normalized = String(value).trim().toLowerCase();
    return ['1', 'true', 'yes', 'y', 'otc'].includes(normalized);
  }

  private mapMedicineUnit(form?: any): MedicineUnit {
    const normalized = String(form || '')
      .trim()
      .toLowerCase();

    switch (normalized) {
      case 'tablet':
        return MedicineUnit.TABLET;
      case 'capsule':
        return MedicineUnit.CAPSULE;
      case 'syrup':
        return MedicineUnit.SYRUP;
      case 'sachet':
        return MedicineUnit.SACHET;
      case 'bottle':
        return MedicineUnit.BOTTLE;
      case 'injection':
        return MedicineUnit.INJECTION;
      case 'iv infusion':
        return MedicineUnit.IV_INFUSION;
      case 'nebules':
        return MedicineUnit.NEBULES;
      default:
        return MedicineUnit.TABLET;
    }
  }

  private mapContraceptiveUnit(name: string, unit: any): MedicineUnit {
    const normalizedUnit = String(unit || '')
      .trim()
      .toLowerCase();
    const normalizedName = name.trim().toLowerCase();

    if (normalizedName.includes('condom')) {
      return MedicineUnit.CONDOM;
    }

    if (normalizedName.includes('injection')) {
      return MedicineUnit.INJECTION;
    }

    if (
      ['copper-t', 'multiload'].some((needle) =>
        normalizedName.includes(needle),
      )
    ) {
      return MedicineUnit.IUD;
    }

    if (
      ['jadelle', 'implanon'].some((needle) =>
        normalizedName.includes(needle),
      )
    ) {
      return MedicineUnit.IMPLANT;
    }

    if (
      normalizedUnit.includes('cycle') ||
      ['coc', 'pop', 'ecp'].includes(normalizedName)
    ) {
      return MedicineUnit.PILL;
    }

    return MedicineUnit.PILL;
  }

  private futureDate(daysFromNow: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date;
  }

  private computeLimitQuantity(unit: MedicineUnit): number | null {
    switch (unit) {
      case MedicineUnit.BOTTLE:
        return 1;
      case MedicineUnit.TABLET:
      case MedicineUnit.CAPSULE:
      case MedicineUnit.PILL:
        return 10;
      case MedicineUnit.SACHET:
      case MedicineUnit.INJECTION:
        return 5;
      default:
        return null;
    }
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
    const parts = compact.split('/').map((p) => p.trim()).filter(Boolean);
    if (!parts.length) {
      return [];
    }

    const lastPart = parts[parts.length - 1];
    const suffixMatch = lastPart.match(/^[\d.,+-]+\s*(.*)$/);
    const suffix = suffixMatch ? suffixMatch[1].trim() : '';

    return parts.map((part, index) => {
      if (index === parts.length - 1) {
        return part;
      }

      if (!suffix) {
        return part;
      }

      const numberMatch = part.match(/^[\d.,+-]+/);
      const numberPortion = numberMatch ? numberMatch[0] : part;
      return `${numberPortion} ${suffix}`.trim();
    });
  }

  private async seedMedicines(
    sheet: ExcelJS.Worksheet,
    facility: Facility | null,
    createdBy: User | null,
  ): Promise<void> {
    for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex++) {
      const row = sheet.getRow(rowIndex);
      const name = String(row.getCell(1).value || '').trim();
      if (!name) {
        continue;
      }

      const otcStatus = this.parseBoolean(row.getCell(2).value);
      const category =
        String(row.getCell(9).value || '').trim() || 'General';

      let medicine = await this.medicineRepository.findOne({
        where: { name },
      });

      if (!medicine) {
        medicine = this.medicineRepository.create({
          name,
          generic_name: name,
          description: 'Seeded from Medicines sheet',
          category,
          contraceptive: false,
        });
      } else {
        medicine.category = category;
        medicine.contraceptive = false;
      }

      medicine = await this.medicineRepository.save(medicine);

      const variantsToSave: MedicineVariant[] = [];
      const variantKeys = new Set<string>();
      const variantSpecs = [
        { form: row.getCell(3).value, strength: row.getCell(4).value },
        { form: row.getCell(5).value, strength: row.getCell(6).value },
        { form: row.getCell(7).value, strength: row.getCell(8).value },
      ];

      for (const spec of variantSpecs) {
        if (!spec.form && !spec.strength) {
          continue;
        }

        const unit = this.mapMedicineUnit(spec.form);
        const strengths = this.splitStrengths(spec.strength);
        const strengthsToUse = strengths.length ? strengths : ['N/A'];

        for (const strength of strengthsToUse) {
          const key = `${unit}-${strength}`;
          if (variantKeys.has(key)) {
            continue;
          }
          variantKeys.add(key);

          const existingVariant = await this.variantRepository.findOne({
            where: {
              medicine: { id: medicine.id },
              unit,
              strength,
            },
            relations: ['medicine'],
          });

          if (!existingVariant) {
            variantsToSave.push(
              this.variantRepository.create({
                medicine,
                unit,
                strength,
              }),
            );
          }
        }
      }

      if (!variantsToSave.length) {
        continue;
      }

      const savedVariants = await this.variantRepository.save(variantsToSave);

      if (!facility) {
        continue;
      }

      const batchesToSave: MedicineBatch[] = [];
      const medicinCountToSave: MedicineCount[] = [];
      for (const [index, variant] of savedVariants.entries()) {
        const existingBatch = await this.batchRepository.findOne({
          where: {
            variant: { id: variant.id },
            facility: { id: facility.id },
          },
        });

        if (existingBatch) {
          continue;
        }

        batchesToSave.push(
          this.batchRepository.create({
            variant,
            medicine,
            facility,
            batch_number: `AUTO-${medicine.id}-${index + 1}`,
            expiry_date: this.futureDate(365),
            purchase_date: new Date(),
            stock_quantity: 100,
            status: MedicineStatus.ACTIVE,
            createdBy: {
              id: createdBy?.id ?? 1,
            } as User,
          }),
        );

        medicinCountToSave.push(
          this.medicineCountRepository.create({
            facilityId: facility.id,
            medicine: { id: medicine.id },
            medicineVariantId: variant.id,
            count: 100,
            otc: otcStatus,
            email_threshold: 5,
            limit_quantity: otcStatus
              ? this.computeLimitQuantity(variant.unit)
              : null,
          })
        );
      }

      if (batchesToSave.length) {
        await this.batchRepository.save(batchesToSave);
        await this.medicineCountRepository.save(medicinCountToSave);

      }
    }
  }

  private async seedContraceptives(
    sheet: ExcelJS.Worksheet,
    facility: Facility | null,
    createdBy: User | null,
  ): Promise<void> {
    for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex++) {
      const row = sheet.getRow(rowIndex);
      const name = String(row.getCell(1).value || '').trim();

      if (!name) {
        continue;
      }

      const category =
        String(row.getCell(2).value || '').trim() || 'Contraceptive';
      const unit = this.mapContraceptiveUnit(name, row.getCell(3).value);

      let medicine = await this.medicineRepository.findOne({
        where: { name },
      });

      if (!medicine) {
        medicine = this.medicineRepository.create({
          name,
          generic_name: name,
          description: 'Seeded from Contraceptives sheet',
          category,
          contraceptive: true,
        });
      } else {
        medicine.category = category;
        medicine.contraceptive = true;
      }

      medicine = await this.medicineRepository.save(medicine);

      let variant = await this.variantRepository.findOne({
        where: {
          medicine: { id: medicine.id },
          unit,
          strength: 'Standard',
        },
        relations: ['medicine'],
      });

      if (!variant) {
        variant = await this.variantRepository.save(
          this.variantRepository.create({
            medicine,
            unit,
            strength: 'Standard',
          }),
        );
      }

      if (!facility) {
        continue;
      }

      const existingBatch = await this.batchRepository.findOne({
        where: {
          variant: { id: variant.id },
          facility: { id: facility.id },
        },
      });

      if (!existingBatch) {
        const batch = this.batchRepository.create({
          variant,
          medicine,
          facility,
          batch_number: `AUTO-${medicine.id}-C`,
          expiry_date: this.futureDate(365),
          purchase_date: new Date(),
          stock_quantity: 100,
          status: MedicineStatus.ACTIVE,
          createdBy: {
            id: createdBy?.id ?? 1,
          } as User,
        });

        const count = this.medicineCountRepository.create({
          facilityId: facility.id,
          medicine: { id: medicine.id },
          medicineVariantId: variant.id,
          count: 100,
          otc: true,
          email_threshold: 5,
          limit_quantity: this.computeLimitQuantity(variant.unit),
        });

        await this.batchRepository.save(batch);
        await this.medicineCountRepository.save(count);

      }
    }
  }
}
