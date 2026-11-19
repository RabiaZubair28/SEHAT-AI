import { PartialType } from '@nestjs/swagger';
import { CreatePreviousPregnancyDto } from './create-previous-pregnancy.dto';

export class UpdatePreviousPregnancyDto extends PartialType(
  CreatePreviousPregnancyDto,
) {}
