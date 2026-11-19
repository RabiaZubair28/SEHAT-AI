import { Taluka } from 'src/taluka/entities/taluka.entity';
import { Facility } from 'src/facilities/entities/facility.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

@Entity('ucs')
export class UC {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('uc_name_index')
  @Column({ length: 255 })
  name: string;

  @ManyToOne(() => Taluka, (taluka) => taluka.ucs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'taluka_id' })
  taluka: Taluka;

  @OneToMany(() => Facility, (facility) => facility.uc)
  facilities: Facility[];
}
