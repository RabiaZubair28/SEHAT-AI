import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import {
  RequestStatus,
  IssuedTo,
  RoleName,
} from '../../common/enums/enums';
import { CommodityRequestItem } from './commodity-request-item.entity';
import { Facility } from 'src/facilities/entities/facility.entity';

@Entity('commodity_requests')
export class CommodityRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: RoleName,
  })
  initiatorRole: RoleName;

  @Column()
  requesterId: number;

  @Column({ name: 'facility_id', type: 'int', nullable: true })
  facilityId: number | null;

  @ManyToOne(() => Facility, { nullable: true })
  @JoinColumn({ name: 'facility_id' })
  facility: Facility | null;

  @Column({ nullable: true })
  requesterName: string;

  @Column({
    type: 'enum',
    enum: IssuedTo,
    nullable: true,
  })
  issuedTo: IssuedTo;

  @Column({ nullable: true })
  issuedToStaffId: number;

  @OneToMany(() => CommodityRequestItem, (item) => item.commodityRequest, {
    cascade: true,
    eager: true,
  })
  items: CommodityRequestItem[];

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status: RequestStatus;

  @Column({ nullable: true })
  processedById: number;

  @Column({ type: 'varchar', nullable: true })
  approvedBy: string | null;

  @Column({ type: 'varchar', nullable: true })
  rejectedBy: string | null;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
