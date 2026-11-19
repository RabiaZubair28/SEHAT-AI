import {
    Entity,
    PrimaryGeneratedColumn,
    OneToOne,
    JoinColumn,
    Column,
    Index,
} from 'typeorm';
import { LevelOfCare, PlaceOfDelivery } from 'src/common/enums/enums';
import { Patient } from 'src/patients/entities/patient.entity';
import type { Facility } from 'src/facilities/entities/facility.entity';

@Entity('immunisation_cards')
export class ImmunisationCard {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'enum', name: 'place_of_delivery', nullable: true, enum: PlaceOfDelivery })
    placeOfDelivery?: PlaceOfDelivery;

    @Column({ type: 'varchar', length: 255, nullable: true })
    districtId?: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    talukaId?: number;

    @Column({ type: 'enum', nullable: true, enum: LevelOfCare })
    level_of_care?: LevelOfCare;

    @Column({ name: 'facility_id', type: 'varchar', nullable: true })
    facilityId?: string | null;

    facility?: Facility | null;

    @Column({ name: 'other_facility_name', type: 'varchar', length: 255, nullable: true })
    otherFacilityName?: string | null;

    @Column({ name: 'immunisation_card_available', type: 'boolean', nullable: true })
    immunisationCardAvailable: boolean;

    @Column({ name: 'immunisation_card_provided', type: 'boolean', nullable: true })
    immunisationCardProvided: boolean;

    @Index('idx_immunisation_cards_patient_id')
    @OneToOne(() => Patient)
    @JoinColumn({ name: 'patient_id' })
    patient: Patient;
}
