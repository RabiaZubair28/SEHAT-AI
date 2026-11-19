import { PartialType } from '@nestjs/swagger';
import { CreateVitalAssesmentDto } from './create-vital-assesment.dto';

export class UpdateVitalAssesmentDto extends PartialType(
  CreateVitalAssesmentDto,
) {}
