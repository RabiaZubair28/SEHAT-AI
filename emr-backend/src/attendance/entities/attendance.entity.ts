import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Facility } from '../../facilities/entities/facility.entity';
import { AttendanceStatus } from 'src/common/enums/enums';

@Entity('attendance')
@Index('idx_attendance_user_id', ['userId'])
@Index('idx_attendance_facility_id', ['facilityId'])
export class Attendance {
  @ApiProperty({ description: 'Attendance ID', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'User ID', example: 1 })
  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @ApiProperty({ description: 'User details', type: () => User })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiPropertyOptional({ description: 'Facility ID', example: 1, nullable: true })
  @Column({ name: 'facility_id', type: 'int', nullable: true })
  facilityId: number | null;

  @ApiPropertyOptional({
    description: 'Facility details',
    type: () => Facility,
    nullable: true,
  })
  @ManyToOne(() => Facility, { eager: true, nullable: true })
  @JoinColumn({ name: 'facility_id' })
  facility: Facility | null;

  @ApiProperty({
    description: 'Attendance check-in timestamp',
    example: '2024-01-01T09:00:00.000Z',
  })
  @Column({ type: 'timestamp', name: 'check_in_time' })
  checkInTime: Date;

  @ApiPropertyOptional({
    description: 'Latitude captured at check-in',
    example: 24.8607,
    nullable: true,
  })
  @Column({ type: 'float', nullable: true })
  latitude: number | null;

  @ApiPropertyOptional({
    description: 'Longitude captured at check-in',
    example: 67.0011,
    nullable: true,
  })
  @Column({ type: 'float', nullable: true })
  longitude: number | null;

  @ApiProperty({
    description: 'Attendance check-in timestamp',
    example: '2024-01-01T09:00:00.000Z',
  })
  @Column({ type: 'timestamp', name: 'check_out_time', nullable: true })
  checkOutTime: Date;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.CHECKED_IN,
  })
  status: AttendanceStatus;

  @Column({ type: 'boolean', name: 'is_mobile', nullable: false, default: false })
  isMobile: boolean;
}
