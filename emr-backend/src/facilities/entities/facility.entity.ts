import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { District } from '../../districts/entities/district.entity';
import { User } from '../../users/entities/user.entity';
import { Appointment } from 'src/appointments/entities/appointment.entity';
import { LevelOfCare } from 'src/common/enums/enums';
import { DeliveryPatient } from 'src/delivery/entities/delivery-patients.entity';
import { UC } from 'src/uc/entities/uc.entity';

@Entity('facilities')
@Index('facility_code_index', ['code'])
@Index('facility_name_index', ['name'])
export class Facility {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'numeric', nullable: true })
  code?: number | null;

  @OneToMany(() => User, (user) => user.facility)
  users: User[];

  @OneToMany(() => DeliveryPatient, (deliveryPatients) => deliveryPatients.facility)
  deliveries: DeliveryPatient;

  @ManyToOne(() => District, (district) => district.facilities)
  @JoinColumn({ name: 'district_id' })
  district: District;

  @ManyToOne(() => UC, (uc) => uc.facilities, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'uc_id' })
  uc?: UC;

  @Column({ type: 'int', nullable: true })
  uc_id?: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  facility_type?: string;

  @OneToMany(() => Appointment, (appointment) => appointment.facility)
  appointments: Appointment[];

  @Column({ type: 'varchar', length: 10, nullable: true })
  managed_by?: string;

  @Column({ type: 'boolean', default: false, nullable: true })
  is_24_7?: boolean;

  @Column({ type: 'boolean', default: false, nullable: true })
  bmu?: boolean;

  @Column({ type: 'boolean', default: false, nullable: true })
  otp?: boolean;

  @Column({ type: 'boolean', default: false, nullable: true })
  nsc?: boolean;

  @Column({ type: 'float', nullable: true })
  lat?: number;

  @Column({ type: 'float', nullable: true })
  long?: number;

  @Column({ type: 'enum', nullable: true, enum: LevelOfCare })
  level_of_care?: LevelOfCare;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
