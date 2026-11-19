import { PartialType, OmitType, ApiPropertyOptional } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAncDto } from './create-anc.dto';
import { UpdatePregnancyInfoDto } from './update-pregnancy-into.dto';

/**
 * Fields frozen after the ANC visit is completed.
 *
 * Prescriptions and immunisation are not editable on update because creating them
 * fired an irreversible downstream side effects. Re-sending them on update would
 * double-dispense or double-record a dose
 *
 * `medicines_prescribed` / `supplements_prescribed` are the flags that gate those
 * lists, so they are frozen alongside them.
 *
 * Everything else is a clinical observation and stays editable inside the TIME_DIFF
 * window enforced in `AncService.update`.
 *
 */
export class UpdateAncDto extends PartialType(
  OmitType(CreateAncDto, [
    'medicines_prescribed',
    'supplements_prescribed',
    'prescriptions',
    'otherPrescriptions',
    'pregnancyInfo',
    'immunisation',
  ] as const),
) {
  /**
   * Re-declared (rather than inherited) because `reason_for_edit` is optional on
   * create but required on update — an edit to pregnancy info must say why.
   */
  @ApiPropertyOptional({ type: UpdatePregnancyInfoDto })
  @ValidateNested()
  @Type(() => UpdatePregnancyInfoDto)
  pregnancyInfo?: UpdatePregnancyInfoDto;
}
