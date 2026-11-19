import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveController } from './leave.controller';
import { LeaveService } from './leave.service';
import { Leave } from './entities/leave.entity';
import { Facility } from 'src/facilities/entities/facility.entity';
import { AuthModule } from 'src/auth/auth.module';
import { User } from 'src/users/entities/user.entity';
import { ExceptionUtility } from 'src/common/utils/helper.util';

@Module({
  imports: [
    TypeOrmModule.forFeature([Leave, Facility, User]),
    forwardRef(() => AuthModule),
  ],
  controllers: [LeaveController],
  providers: [LeaveService, ExceptionUtility],
  exports: [LeaveService],
})
export class LeaveModule {}
