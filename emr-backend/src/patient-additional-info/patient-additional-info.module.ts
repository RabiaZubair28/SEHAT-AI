import { Module } from '@nestjs/common';
import { PatientAdditionalInfoService } from './patient-additional-info.service';
import { PatientAdditionalInfoController } from './patient-additional-info.controller';

@Module({
  controllers: [PatientAdditionalInfoController],
  providers: [PatientAdditionalInfoService],
})
export class PatientAdditionalInfoModule {}
