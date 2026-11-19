import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { TelehealthRequest } from './telehealth-request.entity';
import {
  TelehealthMeetingProvider,
  TelehealthSessionStatus,
} from '../enums/telehealth.enums';

@Entity('telehealth_sessions')
export class TelehealthSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'request_id', type: 'int', unique: true })
  requestId: number;

  @OneToOne(() => TelehealthRequest, (request) => request.session, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'request_id' })
  request: TelehealthRequest;

  @Column({
    type: 'enum',
    enum: TelehealthMeetingProvider,
    default: TelehealthMeetingProvider.GOOGLE_MEET,
  })
  provider: TelehealthMeetingProvider;

  @Column({ name: 'meeting_url', type: 'text', nullable: true })
  meetingUrl: string;

  @Column({ name: 'external_meeting_id', type: 'varchar', length: 255, nullable: true })
  externalMeetingId: string;

  @Column({
    type: 'enum',
    enum: TelehealthSessionStatus,
    default: TelehealthSessionStatus.PENDING,
  })
  status: TelehealthSessionStatus;

  @Column({ name: 'requesting_doctor_id', type: 'int' })
  requestingDoctorId: number;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requesting_doctor_id' })
  requestingDoctor: User;

  @Column({ name: 'consultant_doctor_id', type: 'int' })
  consultantDoctorId: number;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consultant_doctor_id' })
  consultantDoctor: User;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ name: 'ended_at', type: 'timestamp', nullable: true })
  endedAt: Date;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at: Date;
}
