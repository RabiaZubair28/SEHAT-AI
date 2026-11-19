import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PatientAdditionalInfoService } from './patient-additional-info.service';
import { CreatePatientAdditionalInfoDto } from './dto/create-patient-additional-info.dto';
import { UpdatePatientAdditionalInfoDto } from './dto/update-patient-additional-info.dto';

@Controller('patient-additional-info')
export class PatientAdditionalInfoController {
  constructor(
    private readonly patientAdditionalInfoService: PatientAdditionalInfoService,
  ) {}
}
