import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { BaseEntityInfo } from 'src/common/common.entities';
import { User } from 'src/users/entities/user.entity';
import {
  AdvisorPreferences,
  MealPlanContent,
} from '@health-advisor/modules/nutrition-advisor/models/types';

export enum NutritionPlanStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  CHANGES_REQUESTED = 'changes_requested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUPERSEDED = 'superseded',
}

export interface PlanHandoutContent {
  activityGuidance: string;
  activityGuidanceUr: string;
  counselingNotes: string;
  patientNotes: string;
  patientNotesUr: string;
  followUpDate: string | null;
  urduProofread: boolean;
}

// One row per version. Approved versions are immutable; editing one creates a
// new draft version that needs review again (NA-21, NA-22).
@Entity('nutrition_advisor_plans')
@Index('idx_nutrition_advisor_plans_service_version', ['appointmentService', 'version'], { unique: true })
export class NutritionAdvisorPlan extends BaseEntityInfo {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => AppointmentService, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'appointment_service_id' })
  appointmentService: AppointmentService;

  @Column({ name: 'appointment_service_id' })
  appointmentServiceId: number;

  @Column({ name: 'patient_id' })
  patientId: number;

  @Column({ type: 'int' })
  version: number;

  @Column({ type: 'enum', enum: NutritionPlanStatus, default: NutritionPlanStatus.DRAFT })
  status: NutritionPlanStatus;

  @Column({ type: 'jsonb' })
  preferences: AdvisorPreferences;

  @Column({ type: 'jsonb' })
  plan: MealPlanContent;

  @Column({ type: 'jsonb' })
  handout: PlanHandoutContent;

  // Targets, findings and sources the plan was built from, frozen at generation.
  @Column({ name: 'context_snapshot', type: 'jsonb' })
  contextSnapshot: Record<string, any>;

  @Column({ name: 'generated_by', type: 'varchar', length: 40 })
  generatedBy: string; // 'ai:<model>' | 'rules'

  @Column({ name: 'food_data_version', type: 'varchar', length: 40 })
  foodDataVersion: string;

  @Column({ name: 'content_hash', type: 'varchar', length: 64 })
  contentHash: string;

  @Column({ name: 'review_comment', type: 'text', nullable: true })
  reviewComment: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewed_by' })
  reviewedBy: User | null;

  @Column({ name: 'reviewed_by', type: 'int', nullable: true })
  reviewedById: number | null;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @Column({ name: 'previous_version_id', type: 'int', nullable: true })
  previousVersionId: number | null;
}
