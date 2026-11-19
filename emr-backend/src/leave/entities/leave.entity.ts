import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from 'src/users/entities/user.entity';
import { Facility } from 'src/facilities/entities/facility.entity';
import { LeaveStatus } from 'src/common/enums/enums';
import { BaseEntityInfo } from 'src/common/common.entities';

@Entity('leave')
export class Leave extends BaseEntityInfo {
  @ApiProperty({ description: 'Leave ID', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'User ID', example: 1 })
  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @ApiProperty({ description: 'User details', type: () => User })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ description: 'Facility ID', example: 1 })
  @Column({ name: 'facility_id', type: 'int' })
  facilityId: number;

  @ApiProperty({ description: 'Facility details', type: () => Facility })
  @ManyToOne(() => Facility, { eager: true })
  @JoinColumn({ name: 'facility_id' })
  facility: Facility;

  @ApiProperty({ description: 'Start date of leave', example: '2024-01-01' })
  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @ApiProperty({ description: 'End date of leave', example: '2024-01-05' })
  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @ApiPropertyOptional({ description: 'Reason for leave', example: 'Medical leave' })
  @Column({ type: 'text', nullable: true })
  reason: string;

  @ApiProperty({
    description: 'Leave status',
    enum: LeaveStatus,
    example: LeaveStatus.PENDING,
  })
  @Column({
    type: 'enum',
    enum: LeaveStatus,
    default: LeaveStatus.PENDING,
  })
  status: LeaveStatus;
}
