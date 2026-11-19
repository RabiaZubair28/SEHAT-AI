import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Facility } from 'src/facilities/entities/facility.entity';
import { Medicine } from '../../medicine/entities/medicine.entity';
import { MedicineVariant } from '../../medicine/entities/medicine-variant.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('medicine_count')
export class MedicineCount {
  @ApiProperty({
    description: 'Medicine count ID',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Facility ID',
    example: 1,
  })
  @Column({ name: 'facility_id', type: 'int' })
  facilityId: number;

  @ApiProperty({
    description: 'Facility details',
    type: () => Facility,
  })
  @ManyToOne(() => Facility, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'facility_id' })
  facility: Facility;

  @ApiProperty({
    description: 'Medicine ID',
    example: 1,
  })
  @Column({ name: 'medicine_id', type: 'int' })
  medicineId: number;

  @ApiProperty({
    description: 'Medicine details',
    type: () => Medicine,
  })
  @ManyToOne(() => Medicine, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'medicine_id' })
  medicine: Medicine;

  @ApiProperty({
    description: 'Medicine Variant ID',
    example: 1,
  })
  @Column({ name: 'medicine_variant_id', type: 'int' })
  medicineVariantId: number;

  @ApiProperty({
    description: 'Medicine Variant details',
    type: () => MedicineVariant,
  })
  @ManyToOne(
    () => MedicineVariant,
    (medicineVariant) => medicineVariant.medicineCount,
  )
  @JoinColumn({ name: 'medicine_variant_id' })
  medicineVariant: MedicineVariant;

  @ApiProperty({
    description: 'Medicine count',
    example: 100,
  })
  @Column({ type: 'int', default: 0 })
  count: number;

  @Column({ default: false })
  otc: boolean;

  @Column({ type: 'int', nullable: true })
  email_threshold?: number | null;

  @Column({ type: 'int', nullable: true })
  limit_quantity?: number | null;
}
