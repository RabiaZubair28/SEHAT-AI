import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { NotificationRecipient } from './notification-recipient.entity';
import { UserNotification } from './user-notification.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  message: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => NotificationRecipient, (recipient) => recipient.notification)
  recipients: NotificationRecipient[];

  @OneToMany(() => UserNotification, (userNotif) => userNotif.notification)
  userNotifications: UserNotification[];
}
