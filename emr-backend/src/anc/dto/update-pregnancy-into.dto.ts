import { PartialType } from '@nestjs/swagger';
import { CreatePregnancyInfoDto } from './create-pregnancy-into.dto';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ReasonForEdit } from 'src/common/enums/enums';

export class UpdatePregnancyInfoDto extends PartialType(
  CreatePregnancyInfoDto,
) {
  @IsEnum(ReasonForEdit)
  @IsNotEmpty()
  reason_for_edit: ReasonForEdit;
}
