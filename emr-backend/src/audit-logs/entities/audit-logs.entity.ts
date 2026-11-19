import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Facility } from 'src/facilities/entities/facility.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number; // required

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'facility_id', type: 'int', nullable: true })
  facilityId: number;

  @ManyToOne(() => Facility, { eager: true })
  @JoinColumn({ name: 'facility_id' })
  facility: Facility;

  @Column({ type: 'varchar', length: 10 })
  method: string; // required

  @Column({ type: 'varchar', length: 300 })
  route: string; // required

  @Column({ type: 'jsonb', nullable: true })
  body: Record<string, any>;  

  @Column({ type: 'jsonb', nullable: true })
  params: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  query: Record<string, any>;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ip: string;  

  @Column({ name: 'status_code', type: 'int', nullable: true })
  statusCode: number; 

  @Column({ name: 'execution_time_ms', type: 'int', nullable: true })
  executionTimeMs: number;  

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;  
}
