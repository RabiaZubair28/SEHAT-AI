import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MedicineVariant } from 'src/medicine/entities/medicine-variant.entity';
import { CommodityRequest } from './commodity-request.entity';
import { Purpose, RequestStatus } from '../../common/enums/enums';

@Entity('commodity_request_items')
export class CommodityRequestItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CommodityRequest, (request) => request.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'commodity_request_id' })
  commodityRequest: CommodityRequest;

  @ManyToOne(() => MedicineVariant, { eager: true })
  @JoinColumn({ name: 'medicine_variant_id' })
  medicineVariant: MedicineVariant;

  @Column()
  medicineVariantId: number;

  @Column({ type: 'int' })
  quantityRequested: number;

  @Column({ type: 'int', nullable: true })
  quantityDispensed: number;

  @Column({
    type: 'enum',
    enum: Purpose,
  })
  purpose: Purpose;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status: RequestStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}