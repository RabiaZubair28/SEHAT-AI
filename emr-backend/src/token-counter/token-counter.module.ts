import { Module } from '@nestjs/common';
import { TokenCounterService } from './token-counter.service';
import { TokenCounterController } from './token-counter.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenCounter } from './entities/token-counter.entity';
import { AuthModule } from 'src/auth/auth.module';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TokenCounter, User]), AuthModule],
  controllers: [TokenCounterController],
  providers: [TokenCounterService],
  exports: [TokenCounterService],
})
export class TokenCounterModule {}
