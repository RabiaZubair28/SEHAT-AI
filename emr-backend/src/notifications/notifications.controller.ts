import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAdminAuthGuard } from 'src/auth/jwt-admin-auth.guard';
import { JwtOrAuthGuard } from 'src/auth/jwt-or-auth.guard';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('user/:userId')
  @UseGuards(JwtAdminAuthGuard)
  @ApiOperation({
    summary: 'Create notification for a specific user (admin only)',
  })
  @ApiParam({ name: 'userId', type: Number })
  createForUser(
    @Param('userId') userId: number,
    @Body() dto: CreateNotificationDto,
  ) {
    return this.notificationService.createForUser(
      userId,
      dto.title,
      dto.message,
    );
  }

  @Post('role/:roleId')
  @UseGuards(JwtAdminAuthGuard)
  @ApiOperation({
    summary: 'Create notification for a specific role (admin only)',
  })
  @ApiParam({ name: 'roleId', type: Number })
  createForRole(
    @Param('roleId') roleId: number,
    @Body() dto: CreateNotificationDto,
  ) {
    return this.notificationService.createForRole(
      roleId,
      dto.title,
      dto.message,
    );
  }

  @Get()
  @UseGuards(JwtOrAuthGuard)
  @ApiOperation({ summary: 'Get all notifications for current user' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['all', 'read', 'unread'],
  })
  getUserNotifications(@Req() req, @Query('status') status?: string) {
    const userId = req.user?.sub ?? req.user?.id;
    if (status === 'read') {
      return this.notificationService.getAllReadNotifications(userId);
    } else if (status === 'unread') {
      return this.notificationService.getAllUnreadNotifications(userId);
    }
    return this.notificationService.getUserNotifications(userId);
  }

  @Patch(':id/read')
  @UseGuards(JwtOrAuthGuard)
  @ApiOperation({ summary: 'Mark a single notification as read' })
  @ApiParam({ name: 'id', type: Number })
  markAsRead(@Req() req, @Param('id') id: number) {
    const userId = req.user?.sub ?? req.user?.id;
    return this.notificationService.markAsRead(userId, id);
  }

  @Patch('read-all')
  @UseGuards(JwtOrAuthGuard)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllAsRead(@Req() req) {
    const userId = req.user?.sub ?? req.user?.id;
    return this.notificationService.markAllAsRead(userId);
  }

  @Get('unread-count')
  @UseGuards(JwtOrAuthGuard)
  @ApiOperation({
    summary: 'Get count of unread notifications for current user',
  })
  getUnreadCount(@Req() req) {
    const userId = req.user?.sub ?? req.user?.id;
    return this.notificationService.getUnreadCount(userId);
  }
}
