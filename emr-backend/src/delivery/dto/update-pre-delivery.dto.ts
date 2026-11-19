import { PartialType } from '@nestjs/mapped-types';
import { CreatePreDeliveryAssessmentDto } from './pre-delivery.dto';

export class UpdatePreDeliveryAssessmentDto extends PartialType(CreatePreDeliveryAssessmentDto) {}
