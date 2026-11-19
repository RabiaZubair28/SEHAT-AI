import { Module } from '@nestjs/common';
import { TalukaService } from './taluka.service';
import { TalukaController } from './taluka.controller';
import { Taluka } from './entities/taluka.entity';
import { AuthModule } from 'src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Taluka]), AuthModule],
  controllers: [TalukaController],
  providers: [TalukaService],
})
export class TalukaModule {}
