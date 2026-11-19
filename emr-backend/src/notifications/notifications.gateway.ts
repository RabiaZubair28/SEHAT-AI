// notifications/notifications.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { getAllowedOrigins } from 'src/common/utils/cors.util';

@WebSocketGateway({
  cors: {
    origin: getAllowedOrigins(),
    credentials: true,
  },
})
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  // for subscribing the client to the specific channel //first time only i think//
  @SubscribeMessage('register')
  handleRegister(
    @MessageBody() userId: number,
    @ConnectedSocket() client: Socket,
  ) {
    const room = `user_${userId}`;
    client.join(room);
    console.log(`📌 User ${userId} joined room ${room}`);
  }

  sendNotification(userId: number, data: any) {
    this.server.to(`user_${userId}`).emit('notification', data);
  }

  sendNotificationToRole(roleId: number, data: any, memberIds: number[]) {
    for (const userId of memberIds) {
      this.sendNotification(userId, data);
    }
    console.log(
      `📢 Notification sent to role ${roleId} (${memberIds.length} members)`,
    );
  }

  broadcastNotification(data: any) {
    this.server.emit('notification', data);
  }
}
