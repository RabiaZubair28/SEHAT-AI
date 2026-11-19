import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { Notification } from './notification.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('user_notifications')
export class UserNotification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => Notification,
    (notification) => notification.userNotifications,
    { onDelete: 'CASCADE' },
  )
  notification: Notification;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ default: false })
  read: boolean;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date | null;
}
