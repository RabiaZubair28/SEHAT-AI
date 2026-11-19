import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, ValidateNested } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { CreatePreDeliveryAssessmentDto } from "./pre-delivery.dto";
import { CreatePostDeliveryAssessmentDto } from "./post-delivery.dto";
import { CreateNewbornAssessmentDto } from "./newborn.dto";
import { CreateDischargeDetailsDto } from "./discharge.dto";
import { CreateReferralDetailsDto } from "./referral.dto";

export class CreateDeliveryDto {
    @ApiProperty({
        description: 'ID of the associated visit',
        example: 1,
    })
    @IsInt()
    @IsNotEmpty()
    appointment_id: number;

    @ApiProperty({
        type: () => CreatePreDeliveryAssessmentDto,
        required: false
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => CreatePreDeliveryAssessmentDto)
    preDelivery?: CreatePreDeliveryAssessmentDto;

    @ApiProperty({
        type: () => CreatePostDeliveryAssessmentDto,
        required: false
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => CreatePostDeliveryAssessmentDto)
    postDelivery?: CreatePostDeliveryAssessmentDto;

    @ApiProperty({
        type: () => CreateNewbornAssessmentDto,
        isArray: true,
        required: false,
    })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CreateNewbornAssessmentDto)
    newbornAssessments?: CreateNewbornAssessmentDto[];

    @ApiProperty({
        type: () => CreateDischargeDetailsDto,
        required: false
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => CreateDischargeDetailsDto)
    dischargeDetails?: CreateDischargeDetailsDto;

    @ApiProperty({
        type: () => CreateReferralDetailsDto,
        isArray: true,
        required: false,
    })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CreateReferralDetailsDto)
    referralDetails?: CreateReferralDetailsDto[];
}
