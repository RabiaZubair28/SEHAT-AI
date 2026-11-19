import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Notification } from './notification.entity';
import { User } from 'src/users/entities/user.entity';
import { Role } from 'src/roles/entities/role.entity';

@Entity('notification_recipients')
export class NotificationRecipient {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Notification, (notification) => notification.recipients, {
    onDelete: 'CASCADE',
  })
  notification: Notification;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Role, { nullable: true, onDelete: 'CASCADE' })
  role: Role;
}
