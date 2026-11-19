import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AncPregnancyInfo } from 'src/anc/entities/anc-pregnancy-info.entity';
import {
  Complication,
  DeliveryOutcome,
  ModeOfDelivery,
  PlaceOfDelivery,
} from 'src/common/enums/enums';

@Entity('previous_pregnancies')
export class PreviousPregnancy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: PlaceOfDelivery,
    nullable: true,
  })
  place_of_delivery: PlaceOfDelivery;

  @Column({
    type: 'enum',
    enum: DeliveryOutcome,
    nullable: true,
  })
  outcome: DeliveryOutcome;

  @Column({
    type: 'enum',
    enum: ModeOfDelivery,
    nullable: true,
  })
  mode_of_delivery: ModeOfDelivery;

  @Column({
    type: 'enum',
    enum: Complication,
    nullable: true,
    array: true,
  })
  complication: Complication[];

  @Column({
    type: 'text',
    nullable: true
  })
  otherComplication: string;

  @ManyToOne(
    () => AncPregnancyInfo,
    (pregnancy) => pregnancy.previous_pregnancies,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'pregnancy_info_id' })
  pregnancy_info: AncPregnancyInfo;
}
