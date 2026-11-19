import { PartialType } from '@nestjs/mapped-types';
import { CreateDischargeDetailsDto } from './discharge.dto';

export class UpdateDischargeDetailsDto extends PartialType(CreateDischargeDetailsDto) {}
