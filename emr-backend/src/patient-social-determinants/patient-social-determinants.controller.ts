import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PatientSocialDeterminantsService } from './patient-social-determinants.service';
import { CreatePatientSocialDeterminantDto } from './dto/create-patient-social-determinant.dto';
import { UpdatePatientSocialDeterminantDto } from './dto/update-patient-social-determinant.dto';

@Controller('patient-social-determinants')
export class PatientSocialDeterminantsController {
  constructor(
    private readonly patientSocialDeterminantsService: PatientSocialDeterminantsService,
  ) {}
}
