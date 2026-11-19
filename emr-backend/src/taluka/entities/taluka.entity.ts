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
import { District } from '../../districts/entities/district.entity';
import { UC } from 'src/uc/entities/uc.entity';

@Entity('talukas')
export class Taluka {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @ManyToOne(() => District, (district) => district.talukas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'district_id' })
  district: District;

  @OneToMany(() => UC, (uc) => uc.taluka)
  ucs: UC[];
}
