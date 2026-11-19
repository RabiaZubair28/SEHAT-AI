import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Facility } from 'src/facilities/entities/facility.entity';
import { Division } from '../../division/entities/division.entity';
import { Taluka } from 'src/taluka/entities/taluka.entity';

@Entity('districts')
export class District {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @ManyToOne(() => Division, (division) => division.districts)
  @JoinColumn({ name: 'division_id' })
  division: Division;

  @OneToMany(() => Taluka, (Taluka) => Taluka.district)
  talukas: Taluka[];

  @OneToMany(() => Facility, (Facility) => Facility.district)
  facilities: Facility[];
}
