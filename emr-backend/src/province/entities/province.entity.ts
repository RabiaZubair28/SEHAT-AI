import { Division } from 'src/division/entities/division.entity';
import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('provinces')
export class Province {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  @Index({ unique: true })
  name: string;

  @OneToMany(() => Division, (division) => division.province)
  divisions: Division[];
}
