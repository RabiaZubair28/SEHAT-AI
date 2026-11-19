import { Facility } from 'src/facilities/entities/facility.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { MedicineRequestStatus } from 'src/common/enums/enums';
import { BaseEntityInfo } from 'src/common/common.entities';
import { MedicineRequestItem } from './medicine-request-item.entity';

@Entity('medicine_requests')
export class MedicineRequest extends BaseEntityInfo {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor_id' })
  doctor: User;

  @ManyToOne(() => Facility, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'facility_id' })
  facility: Facility;

  @Column({
    type: 'enum',
    enum: MedicineRequestStatus,
    default: MedicineRequestStatus.PENDING,
  })
  status: MedicineRequestStatus;

  @Column()
  request_date: Date;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approved_by' })
  approved_by: User; // dispenser user

  @Column({ nullable: true })
  approved_date: Date;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @OneToMany(() => MedicineRequestItem, (item) => item.request, {
    cascade: true,
  })
  items: MedicineRequestItem[];
}
