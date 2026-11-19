import { PartialType } from '@nestjs/swagger';
import { CreateEmergencyOutcomeDto } from './create-emergency-outcome.dto';

export class UpdateEmergencyOutcomeDto extends PartialType(
  CreateEmergencyOutcomeDto,
) {}
