import { Module } from '@nestjs/common';
import { PatientSocialDeterminantsService } from './patient-social-determinants.service';
import { PatientSocialDeterminantsController } from './patient-social-determinants.controller';

@Module({
  controllers: [PatientSocialDeterminantsController],
  providers: [PatientSocialDeterminantsService],
})
export class PatientSocialDeterminantsModule {}
