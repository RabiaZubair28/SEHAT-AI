import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationRecipient } from './entities/notification-recipient.entity';
import { UserNotification } from './entities/user-notification.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,

    @InjectRepository(NotificationRecipient)
    private recipientRepo: Repository<NotificationRecipient>,

    @InjectRepository(UserNotification)
    private userNotifRepo: Repository<UserNotification>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    private gateway: NotificationsGateway, // WebSocket or similar
  ) {}

  async createForUser(userId: number, title: string, message: string) {
    const notification = this.notificationRepo.create({ title, message });
    await this.notificationRepo.save(notification);

    await this.recipientRepo.save(
      this.recipientRepo.create({ user: { id: userId }, notification }),
    );

    // Push via WS
    this.gateway.sendNotification(userId, notification);

    return notification;
  }

  /**
   * Create notification and send to a role
   */
  async createForRole(roleId: number, title: string, message: string) {
    const notification = this.notificationRepo.create({ title, message });
    await this.notificationRepo.save(notification);

    const users = await this.userRepository.find({
      where: { role: { id: roleId } },
    });
    if (!users.length) {
      return notification; // no users in role, nothing more to do
    }

    const recipients = users.map((user) =>
      this.recipientRepo.create({ user, notification }),
    );
    await this.recipientRepo.save(recipients);

    this.gateway.sendNotificationToRole(
      roleId,
      notification,
      users.map((u) => u.id),
    );

    return notification;
  }

  async getUserNotifications(userId: number) {
    // Get direct user + role-based notifications Query builder is zaroori
    const qb = this.notificationRepo
      .createQueryBuilder('notification')
      .innerJoin('notification.recipients', 'recipient')
      .leftJoin('recipient.user', 'user')
      .leftJoin('recipient.role', 'role')
      .innerJoin('user.roles', 'userRole')
      .where('user.id = :userId OR userRole.id = role.id', { userId })
      .orderBy('notification.createdAt', 'DESC');

    const notifications = await qb.getMany();

    // Ensure UserNotification exists for read tracking
    for (const notif of notifications) {
      let userNotif = await this.userNotifRepo.findOne({
        where: { user: { id: userId }, notification: { id: notif.id } },
      });

      if (!userNotif) {
        userNotif = this.userNotifRepo.create({
          user: { id: userId },
          notification: notif,
          read: false,
        });
        await this.userNotifRepo.save(userNotif);
      }
    }

    return this.userNotifRepo.find({
      where: { user: { id: userId } },
      relations: ['notification'],
      order: { notification: { createdAt: 'DESC' } },
    });
  }

  async markAsRead(userId: number, notificationId: number) {
    let userNotif = await this.userNotifRepo.findOne({
      where: { user: { id: userId }, notification: { id: notificationId } },
    });

    if (!userNotif) {
      userNotif = this.userNotifRepo.create({
        user: { id: userId },
        notification: { id: notificationId },
        read: true,
        readAt: new Date(),
      });
    } else {
      userNotif.read = true;
      userNotif.readAt = new Date();
    }

    await this.userNotifRepo.save(userNotif);
    return { success: true };
  }

  async markAllAsRead(userId: number) {
    await this.userNotifRepo.update(
      { user: { id: userId }, read: false },
      { read: true, readAt: new Date() },
    );
    return { success: true };
  }

  async getUnreadCount(userId: number) {
    return this.userNotifRepo.count({
      where: { user: { id: userId }, read: false },
    });
  }

  async getAllUnreadNotifications(userId: number) {
    return this.userNotifRepo.find({
      where: { user: { id: userId }, read: false },
      relations: ['notification'],
      order: { notification: { createdAt: 'DESC' } },
    });
  }

  async getReadCount(userId: number) {
    return this.userNotifRepo.count({
      where: { user: { id: userId }, read: true },
    });
  }

  async getAllReadNotifications(userId: number) {
    return this.userNotifRepo.find({
      where: { user: { id: userId }, read: true },
      relations: ['notification'],
      order: { notification: { createdAt: 'DESC' } },
    });
  }
}