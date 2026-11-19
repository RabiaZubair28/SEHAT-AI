import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { NutritionAdvisorPlan } from './nutrition-advisor-plan.entity';

export enum NutritionDeliveryChannel {
  WHATSAPP = 'whatsapp',
  DOWNLOAD = 'download',
}

export enum NutritionDeliveryStatus {
  SENT = 'sent',
  FAILED = 'failed',
}

// Auditable record of every official handout that left the EMR (NA-26, NA-27).
@Entity('nutrition_advisor_deliveries')
@Index('idx_nutrition_advisor_deliveries_plan', ['plan'])
export class NutritionAdvisorDelivery {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => NutritionAdvisorPlan, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'plan_id' })
  plan: NutritionAdvisorPlan;

  @Column({ name: 'plan_id' })
  planId: number;

  @Column({ name: 'plan_version', type: 'int' })
  planVersion: number;

  @Column({ name: 'content_hash', type: 'varchar', length: 64 })
  contentHash: string;

  @Column({ type: 'enum', enum: NutritionDeliveryChannel })
  channel: NutritionDeliveryChannel;

  @Column({ type: 'enum', enum: NutritionDeliveryStatus })
  status: NutritionDeliveryStatus;

  @Column({ type: 'varchar', length: 8 })
  language: string; // 'en' | 'ur'

  @Column({ name: 'recipient_masked', type: 'varchar', length: 20, nullable: true })
  recipientMasked: string | null;

  @Column({ name: 'consent_confirmed', type: 'boolean', default: false })
  consentConfirmed: boolean;

  @Column({ name: 'file_path', type: 'varchar', length: 300, nullable: true })
  filePath: string | null;

  @Column({ name: 'file_sha256', type: 'varchar', length: 64, nullable: true })
  fileSha256: string | null;

  @Column({ name: 'provider_message_id', type: 'varchar', length: 120, nullable: true })
  providerMessageId: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  error: string | null;

  @ManyToOne(() => User, { nullable: false, eager: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ name: 'created_by' })
  createdById: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
