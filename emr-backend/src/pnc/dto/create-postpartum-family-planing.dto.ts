import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayUnique, IsBoolean, IsOptional, ValidateIf, ValidateNested } from 'class-validator';
import { CreateOtherPrescriptionDto } from 'src/diagnosis-prescriptions/dto/create-other-prescription.dto';
import { CreatePrescriptionDto } from 'src/diagnosis-prescriptions/dto/create-prescription.dto';

export class CreatePostpartumFamilyPlanningDto {
  @ApiProperty({
    example: true,
    description: 'Did you counsel the patient on family planning?',
  })
  @IsBoolean()
  counseledOnFamilyPlanning: boolean;

  @ApiProperty({
    example: true,
    description: 'Did you dispense any family planning methods to the patient?',
  })
  @IsBoolean()
  dispenserFpMethods: boolean;

  @ApiPropertyOptional({
    type: [CreatePrescriptionDto],
    example: [
      {
        medicine_variant_id: 42,
        quantity: 2,
      },
      {
        medicine_variant_id: 43,
        quantity: 2,
      },
    ],
  })
  @IsOptional()
  @ValidateIf((o) => o.dispenserFpMethods === true)
  @ArrayUnique((p) => p.medicine_variant_id, { message: 'Prescriptions must have unique medicine variant ids' })
  @ValidateNested({ each: true })
  @Type(() => CreatePrescriptionDto)
  prescriptions?: CreatePrescriptionDto[];

  @ValidateNested({ each: true })
  @ValidateIf((o) => o.dispenserFpMethods === true)
  @ArrayUnique((p) => p.name, { message: 'Other prescriptions must have unique names' })
  @ApiPropertyOptional({
    type: [CreateOtherPrescriptionDto],
    example: [
      {
        name: 'Contraceptive Pills',
        quantity: 2,
      },
      {
        name: 'Injectables',
        quantity: 2,
      },
    ],
  })
  @IsOptional()
  @Type(() => CreateOtherPrescriptionDto)
  otherPrescriptions?: CreateOtherPrescriptionDto[];
}
