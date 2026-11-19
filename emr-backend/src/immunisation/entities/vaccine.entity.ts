import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import {
  VaccineAppliedTo,
  VaccineCatchUpMode,
  VaccineGenderRestriction,
} from 'src/common/enums/enums';

@Entity('vaccines')
@Index(['code', 'dose_number'], { unique: true })
export class Vaccine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  code: string;

  @Column({ name: 'display_name' })
  display_name: string;

  @Column({
    name: 'seir_name',
    type: 'varchar',
    nullable: true,
  })
  seir_name: string | null;

  @Column({
    name: 'series_name',
    type: 'varchar',
    nullable: true,
  })
  series_name: string | null;

  @Column({ type: 'int', default: 0 })
  dose_number: number;

  @Column({ type: 'int', default: 0 })
  age_min_days: number;

  @Column({ type: 'int', nullable: true })
  age_overdue_days: number | null;

  @Column({ name: 'max_age_days', type: 'int', nullable: true })
  max_age_days: number | null;

  @Column({
    name: 'applies_to',
    type: 'varchar',
    length: 50,
    default: VaccineAppliedTo.CHILD,
  })
  applies_to: VaccineAppliedTo;

  @Column({
    name: 'gender_restriction',
    type: 'varchar',
    length: 20,
    default: VaccineGenderRestriction.ANY,
  })
  gender_restriction: VaccineGenderRestriction;

  @Column({
    name: 'pre_requisite_codes',
    type: 'text',
    array: true,
    nullable: true,
  })
  pre_requisite_codes: string[] | null;

  @Column({
    name: 'catch_up_1_to_2_mode',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  catch_up_1_to_2_mode: VaccineCatchUpMode | null;

  @Column({
    name: 'catch_up_1_to_2_interval_days',
    type: 'int',
    nullable: true,
  })
  catch_up_1_to_2_interval_days: number | null;

  @Column({
    name: 'catch_up_1_to_2_note',
    type: 'text',
    nullable: true,
  })
  catch_up_1_to_2_note: string | null;

  @Column({
    name: 'catch_up_above_2_mode',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  catch_up_above_2_mode: VaccineCatchUpMode | null;

  @Column({
    name: 'catch_up_above_2_interval_days',
    type: 'int',
    nullable: true,
  })
  catch_up_above_2_interval_days: number | null;

  @Column({
    name: 'catch_up_above_2_note',
    type: 'text',
    nullable: true,
  })
  catch_up_above_2_note: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  order: number;
}
