import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MedicineVariant } from './medicine-variant.entity';
import { MedicineBatch } from './medicine-batch.entity';

@Entity('medicines')
export class Medicine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string; // Brand/trade name

  @Column({ length: 255, nullable: true })
  generic_name: string; // Active ingredient

  @Column({ nullable: true })
  description: string;

  @Column({ length: 100 })
  category: string;

  @Column({ default: false })
  contraceptive: boolean;

  @OneToMany(() => MedicineVariant, (variant) => variant.medicine)
  variants: MedicineVariant[];

  @OneToMany(() => MedicineBatch, (batch) => batch.medicine)
  batches: MedicineBatch[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
