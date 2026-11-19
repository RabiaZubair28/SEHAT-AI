import {
  Entity,
  Index,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Service } from 'src/services/entities/service.entity';
import { BaseEntityInfo } from 'src/common/common.entities';

@Entity('user_services')
@Index('IDX_37ea84a080a4b47133471852d5', ['userId'])
@Index('IDX_74bbbb213ecc45e9444e3145b2', ['serviceId'])
export class UserService extends BaseEntityInfo {
  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  @PrimaryColumn({ name: 'service_id' })
  serviceId: number;

  @ManyToOne(() => User, (user) => user.userServices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Service, (service) => service, {
    onDelete: 'CASCADE',
    cascade: true,
  })
  @JoinColumn({ name: 'service_id' })
  service: Service;
}
