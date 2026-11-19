import { Injectable, Logger, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Leave } from './entities/leave.entity';
import { CreateLeaveDto } from './dtos/create-leave.dto';
import { ExceptionUtility } from 'src/common/utils/helper.util';
import { ApiResponseMessages } from 'src/common/api-messages.constants';
import { LeaveStatus, RoleName } from 'src/common/enums/enums';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class LeaveService {
  private readonly logger: Logger = new Logger(LeaveService.name);

  constructor(
    @InjectRepository(Leave)
    private leaveRepository: Repository<Leave>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createLeaveDto: CreateLeaveDto, loggedInUserId: number, facilityId: number): Promise<Leave> {
    try {

      await this.validate(createLeaveDto, createLeaveDto.userId, facilityId);

      const leave = this.leaveRepository.create({
        startDate: createLeaveDto.startDate,
        endDate: createLeaveDto.endDate,
        reason: createLeaveDto.reason,
        status: LeaveStatus.APPROVED,
        userId: createLeaveDto.userId,
        createdById: loggedInUserId,
        facilityId,
      });

      return await this.leaveRepository.save(leave);
    } catch (error) {
      this.logger.error(ApiResponseMessages.LEAVE_CREATE_ERROR, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.LEAVE_CREATE_ERROR,
      );
    }
  }

  async findAll(userId: number, role: string, facilityId?: number): Promise<Leave[]> {
    try {
      let whereCondition: any = {};

      // If user is admin or super admin, fetch all leaves
      if (role === RoleName.SUPER_ADMIN || role === RoleName.ADMIN) {
        whereCondition = {};
      }
      // If user is facility incharge, fetch leaves from the same facility
      else if (role === RoleName.FACILITY_INCHARGE) {
        whereCondition = { facilityId };
      }
      // For regular users, fetch only their own leaves
      else {
        whereCondition = { userId };
      }

      return await this.leaveRepository.find({
        where: whereCondition,
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(ApiResponseMessages.LEAVE_FETCH_ERROR, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.LEAVE_FETCH_ERROR,
      );
    }
  }

  async delete(leaveId: number, loggedInUserFacilityId: number): Promise<void> {
    try {
      // Find the leave record
      const leave = await this.leaveRepository.findOne({
        where: { id: leaveId },
      });

      if (!leave) {
        throw new NotFoundException(ApiResponseMessages.LEAVE_NOT_FOUND);
      }

      // Check if the leave belongs to the same facility as the logged-in user
      if (leave.facilityId !== loggedInUserFacilityId) {
        throw new ForbiddenException('You can only delete leave for users in your facility');
      }

      // Check if the leave has already started or ended
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(leave.startDate);

      if (startDate <= today) {
        throw new ConflictException(ApiResponseMessages.LEAVE_CANNOT_DELETE_PAST);
      }

      // Delete the leave record
      await this.leaveRepository.remove(leave);
    } catch (error) {
      this.logger.error(ApiResponseMessages.LEAVE_DELETE_ERROR, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.LEAVE_DELETE_ERROR,
      );
    }
  }

  private async validate(createLeaveDto: CreateLeaveDto, userId: number, loggedInUserFacilityId: number): Promise<void> {
    const startDate = new Date(createLeaveDto.startDate);
    const endDate = new Date(createLeaveDto.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if end date is less than start date
    if (endDate < startDate) {
      throw new ConflictException(ApiResponseMessages.LEAVE_INVALID_DATE_RANGE);
    }

    // Check if the user belongs to the same facility as the logged-in user
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['facility'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.facility?.id !== loggedInUserFacilityId) {
      throw new ForbiddenException('You can only create leave for users in your facility');
    }

    // Check if dates are in the past
    if (startDate < today || endDate < today) {
      throw new ConflictException(ApiResponseMessages.LEAVE_DATE_IN_PAST);
    }

    // Check for overlapping leaves
    const overlappingLeave = await this.leaveRepository
      .createQueryBuilder('leave')
      .where('leave.userId = :userId', { userId })
      .andWhere(
        '(leave.start_date <= :endDate AND leave.end_date >= :startDate)',
        {
          startDate: createLeaveDto.startDate,
          endDate: createLeaveDto.endDate,
        },
      )
      .getOne();

    if (overlappingLeave) {
      throw new ConflictException(ApiResponseMessages.LEAVE_OVERLAPPING);
    }
  }
}
