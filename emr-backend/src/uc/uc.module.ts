import { Module } from '@nestjs/common';
import { UcService } from './uc.service';
import { UcController } from './uc.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UC } from './entities/uc.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([UC]), AuthModule],
  controllers: [UcController],
  providers: [UcService],
})
export class UcModule {}
