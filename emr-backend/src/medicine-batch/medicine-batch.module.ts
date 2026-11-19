import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicineBatchController } from './medicine-batch.controller';
import { MedicineBatchService } from './medicine-batch.service';
import { MedicineBatch } from 'src/medicine/entities/medicine-batch.entity';
import { User } from 'src/users/entities/user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { MedicineCount } from './entities/medicine-count.entity';
import { DispenseItem } from 'src/dispenser/entities/dispense-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MedicineBatch, MedicineCount, User, DispenseItem]),
    forwardRef(() => AuthModule),
  ],
  controllers: [MedicineBatchController],
  providers: [MedicineBatchService],
  exports: [MedicineBatchService],
})
export class MedicineBatchModule {}
