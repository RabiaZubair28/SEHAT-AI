import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateNewbornAssessmentDto } from './newborn.dto';

// Omit the fields that should not be updatable
export class UpdateNewbornAssessmentDto extends PartialType(
  OmitType(CreateNewbornAssessmentDto, [
    'medicineProvided',
    'vaccinesAdministered',
  ] as const),
) {}