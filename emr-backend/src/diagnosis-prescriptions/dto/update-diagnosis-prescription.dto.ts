import { PartialType } from '@nestjs/swagger';
import { CreateDiagnosisPrescriptionDto } from './create-diagnosis-prescription.dto';

export class UpdateDiagnosisPrescriptionDto extends PartialType(
  CreateDiagnosisPrescriptionDto,
) {}
