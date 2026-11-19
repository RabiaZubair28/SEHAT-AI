import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
  DeleteDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BloodType, Gender, MaritalStatus } from 'src/common/enums/enums';

@Entity('user_personal_infos')
export class UserPersonalInfo {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, (user) => user.personalInfo)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 13 })
  cnic: string;

  @Column({ type: 'date' })
  dob: string;

  @Column({
    type: 'enum',
    enum: Gender,
  })
  gender: Gender;

  @Column({ type: 'varchar', length: 15 })
  contact: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  qualifications?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  specialization?: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  emergency_contact?: string;

  @Column({
    type: 'enum',
    enum: BloodType,
    nullable: true,
  })
  blood_type: BloodType;

  @Column({
    type: 'enum',
    enum: MaritalStatus,
  })
  marital_status: MaritalStatus;

  @Column({ type: 'varchar', length: 100 })
  nationality: string;

  @Column({ type: 'varchar', length: 25 })
  religion: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at: Date;
}
