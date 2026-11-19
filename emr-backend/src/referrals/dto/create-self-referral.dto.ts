import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateSelfReferralDto {
    @ApiProperty({
        description: 'ID of the patient being referred',
        example: 1,
    })
    @IsNumber()
    patient_id: number;

    @ApiProperty({
        description: 'Selected service ID',
        example: 1,
        required: true,
    })
    @IsNumber()
    service_id: number;
}
