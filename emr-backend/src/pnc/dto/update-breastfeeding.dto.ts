import { PartialType } from '@nestjs/swagger';
// You must ensure this path and file exist in your project
import { CreateBreastfeedingDto } from './create-breastfeeding.dto';

export class UpdateBreastfeedingDto extends PartialType(
  CreateBreastfeedingDto,
) { }
