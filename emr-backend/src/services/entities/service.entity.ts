import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { UserService } from 'src/user-services/entities/user-service.entity';
import { User } from 'src/users/entities/user.entity';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToMany(() => User, (user) => user.services)
  users: User[];

  @OneToMany(() => UserService, (userService) => userService.service)
  userServices: UserService[];

  @OneToMany(() => AppointmentService, (as) => as.service)
  appointmentServices: AppointmentService[];
}
