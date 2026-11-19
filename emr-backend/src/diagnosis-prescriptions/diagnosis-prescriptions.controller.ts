import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { DiagnosisPrescriptionsService } from './diagnosis-prescriptions.service';
import { CreateDiagnosisPrescriptionDto } from './dto/create-diagnosis-prescription.dto';
import { UpdateDiagnosisPrescriptionDto } from './dto/update-diagnosis-prescription.dto';

@Controller('diagnosis-prescriptions')
export class DiagnosisPrescriptionsController {
  constructor(
    private readonly diagnosisPrescriptionsService: DiagnosisPrescriptionsService,
  ) {}
}
