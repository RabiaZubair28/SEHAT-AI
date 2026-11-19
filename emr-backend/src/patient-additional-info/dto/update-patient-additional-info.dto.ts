import { PartialType } from '@nestjs/swagger';
import { CreatePatientAdditionalInfoDto } from './create-patient-additional-info.dto';

export class UpdatePatientAdditionalInfoDto extends PartialType(
  CreatePatientAdditionalInfoDto,
) {}
