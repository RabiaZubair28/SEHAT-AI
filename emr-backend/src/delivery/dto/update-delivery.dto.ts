import { UpdatePreDeliveryAssessmentDto } from './update-pre-delivery.dto';
import { UpdatePostDeliveryAssessmentDto } from './update-post-delivery.dto';
import { UpdateNewbornAssessmentDto } from './update-newborn-assesment.dto';
import { UpdateDischargeDetailsDto } from './update-discharge.dto';
import { UpdateReferralDetailsDto } from './update-referral.dto';
import { IsInt, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateDeliveryDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePreDeliveryAssessmentDto)
  preDelivery?: UpdatePreDeliveryAssessmentDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePostDeliveryAssessmentDto)
  postDelivery?: UpdatePostDeliveryAssessmentDto;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateNewbornAssessmentDto)
  newbornAssessments?: UpdateNewbornAssessmentDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateDischargeDetailsDto)
  dischargeDetails?: UpdateDischargeDetailsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateReferralDetailsDto)
  referralDetails?: UpdateReferralDetailsDto;

  @IsOptional()
  @IsInt()
  appointment_id?: number;
}

