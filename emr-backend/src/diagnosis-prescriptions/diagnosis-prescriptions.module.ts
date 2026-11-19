import { Module } from '@nestjs/common';
import { DiagnosisPrescriptionsService } from './diagnosis-prescriptions.service';
import { DiagnosisPrescriptionsController } from './diagnosis-prescriptions.controller';

@Module({
  controllers: [DiagnosisPrescriptionsController],
  providers: [DiagnosisPrescriptionsService],
})
export class DiagnosisPrescriptionsModule {}
