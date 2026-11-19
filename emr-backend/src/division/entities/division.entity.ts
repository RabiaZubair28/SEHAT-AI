import {
  BeforeInsert,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { District } from '../../districts/entities/district.entity';
import { Province } from 'src/province/entities/province.entity';

@Entity('divisions')
export class Division {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  @Index({ unique: true })
  name: string;

  @ManyToOne(() => Province, (province) => province.divisions, {
    nullable: true,
  })
  @JoinColumn({ name: 'province_id' })
  province: Province | null;

  @Column({ nullable: true })
  province_id: number | null;

  @OneToMany(() => District, (district) => district.division)
  districts: District[];

  @BeforeInsert()
  applyDefaultProvince() {
    if (!this.province && !this.province_id) {
      this.province_id = 1;
    }
  }
}
