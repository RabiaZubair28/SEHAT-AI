import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { MedicineStatus } from 'src/common/enums/enums';
import { Facility } from 'src/facilities/entities/facility.entity';
import { BaseEntityInfo } from 'src/common/common.entities';
import { DispenseItem } from 'src/dispenser/entities/dispense-item.entity';
import { MedicineVariant } from './medicine-variant.entity';
import { Medicine } from './medicine.entity';

@Entity('medicine_batches')
export class MedicineBatch extends BaseEntityInfo {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => MedicineVariant, (variant) => variant.batches, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'variant_id' })
  variant: MedicineVariant;

  @ManyToOne(() => Facility, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'facility_id' })
  facility: Facility;

  @Column({ length: 100 })
  batch_number: string;

  @Column({ type: 'date' })
  expiry_date: Date;

  @Column({ type: 'date', nullable: true })
  purchase_date: Date;

  @Column({ type: 'int', default: 0 })
  stock_quantity: number;

  @Column({
    type: 'enum',
    enum: MedicineStatus,
    default: MedicineStatus.ACTIVE,
  })
  status: MedicineStatus;

  @ManyToOne(() => Medicine, (medicine) => medicine.batches, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'medicine_id' })
  medicine: Medicine;

  @OneToMany(() => DispenseItem, (item) => item.batch)
  dispenseItems: DispenseItem[];
}
