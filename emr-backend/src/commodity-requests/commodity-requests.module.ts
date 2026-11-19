import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicineVariant } from 'src/medicine/entities/medicine-variant.entity';
import { MedicineBatch } from 'src/medicine/entities/medicine-batch.entity';
import { CommodityRequest } from './entities/commodity-request.entity';
import { CommodityRequestItem } from './entities/commodity-request-item.entity';
import { CommodityRequestController } from './commodity-requests.controller';
import { CommodityRequestService } from './commodity-requests.service';
import { AuthModule } from 'src/auth/auth.module';
import { User } from 'src/users/entities/user.entity';
import { DoctorMedicineStock } from 'src/medicine/entities/doctor-medicine-stock.entity';
import { Role } from 'src/roles/entities/role.entity';
import { MedicineCount } from 'src/medicine-batch/entities/medicine-count.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CommodityRequest,
      CommodityRequestItem,
      MedicineVariant,
      MedicineBatch,
      User,
      DoctorMedicineStock,
      Role,
      MedicineCount
    ]),
    AuthModule,
  ],
  controllers: [CommodityRequestController],
  providers: [CommodityRequestService],
  exports: [CommodityRequestService],
})
export class CommodityRequestModule {}