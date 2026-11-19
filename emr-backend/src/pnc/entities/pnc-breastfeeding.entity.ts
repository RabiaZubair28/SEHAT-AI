import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { BreastfeedingIssue } from 'src/common/enums/enums';

@Entity('pnc_breastfeedings')
export class PncBreastfeeding {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(
    () => AppointmentService,
    (appointmentService) => appointmentService.pncBreastfeeding,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'appointment_service_id' })
  appointmentService: AppointmentService;

  @Column({ type: 'boolean', nullable: true })
  early_breastfeeding: boolean;

  @Column({ type: 'boolean', default: false })
  exclusive_breastfeeding: boolean;

  @Column({ type: 'boolean', default: false })
  reported_issue_with_breastfeeding: boolean;

  @Column({
    type: 'enum',
    enum: BreastfeedingIssue,
    array: true,
    nullable: true,
  })
  breastfeeding_issues: BreastfeedingIssue[];

  @Column({
    name: 'other_breastfeeding_issue',
    type: 'text',
    nullable: true,
  })
  otherBreastfeedingIssue?: string;
}
