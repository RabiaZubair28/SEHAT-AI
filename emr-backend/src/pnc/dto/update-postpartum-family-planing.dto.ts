import { OmitType, PartialType } from '@nestjs/swagger';

import { CreatePostpartumFamilyPlanningDto } from './create-postpartum-family-planing.dto';

export class UpdatePostpartumFamilyPlanningDto extends PartialType(
  OmitType(CreatePostpartumFamilyPlanningDto, [
    'dispenserFpMethods',
    'prescriptions',
  ] as const),
) { }
