import { PartialType } from '@nestjs/swagger';
import { CreateImmunisationDto } from './create-immunisation.dto';

export class UpdateImmunisationDto extends PartialType(CreateImmunisationDto) {}
