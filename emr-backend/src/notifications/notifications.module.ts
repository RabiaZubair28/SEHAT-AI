import { Module } from '@nestjs/common';
import { NotificationService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsGateway } from './notifications.gateway';
import { Notification } from './entities/notification.entity';
import { UserNotification } from './entities/user-notification.entity';
import { NotificationRecipient } from './entities/notification-recipient.entity';
import { User } from 'src/users/entities/user.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      UserNotification,
      NotificationRecipient,
      User,
    ]),
    AuthModule,
  ],
  providers: [NotificationService, NotificationsGateway],
  controllers: [NotificationsController],
  exports: [NotificationService],
})
export class NotificationsModule {}
