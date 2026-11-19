import { ImmunisationDailyRollupType } from 'src/common/enums/enums';
import { Entity, PrimaryColumn } from 'typeorm';

@Entity('immunisation_rollup_seen_patients')
export class ImmunisationRollupSeenPatient {
  @PrimaryColumn({ name: 'rollup_date', type: 'date' })
  rollupDate: string;

  @PrimaryColumn({ name: 'aggregation_type', type: 'varchar', length: 20 })
  aggregationType: ImmunisationDailyRollupType;

  @PrimaryColumn({ name: 'dimension_id', type: 'int' })
  dimensionId: number;

  @PrimaryColumn({ name: 'patient_id', type: 'int' })
  patientId: number;
}
