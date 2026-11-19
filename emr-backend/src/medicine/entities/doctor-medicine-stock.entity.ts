import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Facility } from 'src/facilities/entities/facility.entity';
import { BaseEntityInfo } from 'src/common/common.entities';
import { MedicineVariant } from './medicine-variant.entity';

@Entity('doctor_medicine_stocks')
export class DoctorMedicineStock extends BaseEntityInfo {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor_id' })
  doctor: User;

  @ManyToOne(() => Facility, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'facility_id' })
  facility: Facility;

  @ManyToOne(() => MedicineVariant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'medicine_variant_id' })
  medicineVariant: MedicineVariant;

  @Column()
  quantity: number;
}
