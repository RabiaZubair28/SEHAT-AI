import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Immunisation } from './immunisation.entity';
import { Vaccine } from './vaccine.entity';
import { ImmunisationDosageStatus } from 'src/common/enums/enums';
import { Patient } from 'src/patients/entities/patient.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('immunisation_doses')
export class ImmunisationDose {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Vaccine)
  @JoinColumn({ name: 'vaccine_id' })
  vaccine: Vaccine;

  @Column({ name: 'date_administered', type: 'date' })
  dateAdministered: Date;

  @Column({
    type: 'enum',
    enum: ImmunisationDosageStatus,
    default: ImmunisationDosageStatus.PENDING,
  })
  status: ImmunisationDosageStatus;

  @Column({ type: 'float', nullable: true })
  latitude: number | null;

  @Column({ type: 'float', nullable: true })
  longitude: number | null;

  @Index('idx_immunisation_doses_patient_id')
  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @ManyToOne(() => Immunisation, (immunisation) => immunisation.doses, {
    onDelete: 'CASCADE',
  })
  @Index('idx_immunisation_doses_immunisation_id')
  @JoinColumn({ name: 'immunisation_id' })
  immunisation: Immunisation;

  @Index('idx_immunisation_doses_vaccinated_by')
  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'vaccinated_by' })
  vaccinatedBy?: User;
}
