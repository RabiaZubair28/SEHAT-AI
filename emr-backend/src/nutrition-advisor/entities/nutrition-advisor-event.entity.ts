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

export enum NutritionAdvisorAction {
  GENERATED = 'generated',
  EDITED = 'edited',
  NEW_VERSION = 'new_version',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CHANGES_REQUESTED = 'changes_requested',
  DOWNLOADED = 'downloaded',
  SENT = 'sent',
  SEND_FAILED = 'send_failed',
}

// Who proposed, edited, approved or shared a plan and when (SH-05).
// Details hold identifiers and hashes only, never clinical free text.
@Entity('nutrition_advisor_events')
@Index('idx_nutrition_advisor_events_plan', ['plan'])
export class NutritionAdvisorEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => NutritionAdvisorPlan, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'plan_id' })
  plan: NutritionAdvisorPlan;

  @Column({ name: 'plan_id' })
  planId: number;

  @Column({ type: 'enum', enum: NutritionAdvisorAction })
  action: NutritionAdvisorAction;

  @ManyToOne(() => User, { nullable: false, eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
