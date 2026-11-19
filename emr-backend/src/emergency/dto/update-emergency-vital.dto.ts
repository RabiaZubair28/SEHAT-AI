import { PartialType } from '@nestjs/swagger';
import { CreateEmergencyVitalDto } from './create-emergency-vital.dto';

export class UpdateEmergencyVitalDto extends PartialType(
  CreateEmergencyVitalDto,
) {}
