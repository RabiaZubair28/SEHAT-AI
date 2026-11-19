import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Dispenser } from './dispenser.entity';
import { BaseEntityInfo } from 'src/common/common.entities';
import { MedicineBatch } from 'src/medicine/entities/medicine-batch.entity';
import { MedicineVariant } from 'src/medicine/entities/medicine-variant.entity';

@Entity('dispense_items')
export class DispenseItem extends BaseEntityInfo {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Dispenser, (dispenser) => dispenser.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'dispense_id' })
  dispense: Dispenser;

  @ManyToOne(() => MedicineVariant, (variant) => variant.dispenseItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'medicine_variant_id' })
  medicineVariant: MedicineVariant;

  @ManyToOne(() => MedicineBatch, (batch) => batch.dispenseItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'batch_id' })
  batch: MedicineBatch;

  @Column({ type: 'int', default: 0 })
  required_qty: number;

  @Column()
  dispensed_qty: number;

  @Column({
    name: 'medicine_dosage',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  medicineDosage: string;

  @Column({ name: 'medicine_duration', type: 'int', nullable: true })
  medicineDuration: number;

  @Column({ default: false })
  otc: boolean;
}
