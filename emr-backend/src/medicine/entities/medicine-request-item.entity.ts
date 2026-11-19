import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MedicineRequest } from './medicine-request.entity';
import { Medicine } from './medicine.entity';
import { BaseEntityInfo } from 'src/common/common.entities';

@Entity('medicine_request_items')
export class MedicineRequestItem extends BaseEntityInfo {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => MedicineRequest, (request) => request.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'request_id' })
  request: MedicineRequest;

  @ManyToOne(() => Medicine, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'medicine_id' })
  medicine: Medicine;

  @Column()
  requested_qty: number;

  @Column({ nullable: true })
  approved_qty: number;
}
