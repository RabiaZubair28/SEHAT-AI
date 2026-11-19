import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { UnauthorizedException } from '@nestjs/common';
import { getAllowedOrigins } from 'src/common/utils/cors.util';

interface SocketJwtPayload {
  sub?: string | number;
  role?: string;
}

@WebSocketGateway({
  cors: {
    origin: getAllowedOrigins(),
    credentials: true,
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    try {
      const { token } = client.handshake.auth;
      if (!token) throw new UnauthorizedException('Missing token');

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret)
        throw new UnauthorizedException('JWT secret not configured');

      const decodedPayload = jwt.verify(token, jwtSecret) as SocketJwtPayload;
      const payload = {
        sub: decodedPayload?.sub,
        role: decodedPayload?.role,
      };
      const userId = Number(payload.sub);
      const role = payload.role;

      if (!Number.isInteger(userId) || !role) {
        throw new UnauthorizedException('Invalid token');
      }

      client.data.userId = userId;
      client.data.role = role;

      client.join(role);
      console.log(
        `User ${userId} with role "${role}" connected to room ${role}`,
      );
    } catch (err) {
      console.error('Socket auth failed:', err.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`User ${client.data?.userId} disconnected`);
  }

  emitToRoles(roles: string[], event: string, payload: any) {
    roles.forEach((role) => {
      this.server.to(role).emit(event, payload);
    });
  }

  emitToUser(userId: number, event: string, payload: any) {
    const socketId = [...this.server.sockets.sockets.values()].find(
      (s) => s.data.userId === userId,
    )?.id;

    if (socketId) {
      this.server.to(socketId).emit(event, payload);
    }
  }
}
