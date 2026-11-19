import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateOpdDto } from './create-opd.dto';

export class UpdateOpdDto extends PartialType(
  OmitType(CreateOpdDto, ['prescriptions'] as const),
) {}
