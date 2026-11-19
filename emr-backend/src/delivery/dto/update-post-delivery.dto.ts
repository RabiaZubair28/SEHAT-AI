import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDeliveryAssessmentDto } from './post-delivery.dto';
import { OmitType } from '@nestjs/swagger';
export class UpdatePostDeliveryAssessmentDto extends PartialType(
    OmitType(CreatePostDeliveryAssessmentDto, ['medicinesAdministered'] as const),
) { }
