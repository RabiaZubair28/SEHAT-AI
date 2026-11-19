import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'client_key', type: 'varchar', length: 128, unique: true })
  clientKey: string;

  @Column({ name: 'client_name', type: 'varchar', length: 120, unique: true })
  clientName: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @Column({
    name: 'allowed_ips',
    type: 'text',
    array: true,
    default: () => "'{}'",
  })
  allowedIps: string[];
}
