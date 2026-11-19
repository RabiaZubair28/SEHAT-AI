import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PatientQueueService } from './patient-queue.service';
import { CreatePatientQueueDto } from './dto/create-patient-queue.dto';
import { UpdatePatientQueueDto } from './dto/update-patient-queue.dto';

@Controller('patient-queue')
export class PatientQueueController {
  constructor(private readonly patientQueueService: PatientQueueService) {}
}
