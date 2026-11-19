import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { LabTest, LabTestUrgency } from 'src/common/enums/enums';

export class LabTestItemDto {
  @ApiProperty({ enum: LabTest, example: LabTest.CBC })
  @IsEnum(LabTest)
  name: LabTest;

  @ApiProperty({ enum: LabTestUrgency, example: LabTestUrgency.ROUTINE })
  @IsEnum(LabTestUrgency)
  urgency: LabTestUrgency;

  @ApiPropertyOptional({ example: 'Other lab test details' })
  @ValidateIf((o) => o.name === LabTest.OTHER)
  other?: string;
}

export class CreateDiagnosisDto {
  @ApiProperty({ example: true, required: true })
  @IsBoolean()
  screenedRubella: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @ValidateIf((o) => o.screenedRubella === true)
  @IsBoolean()
  rubellaPositive?: boolean;

  @ApiProperty({ example: true, required: true })
  @IsBoolean()
  screenedHepB: boolean;

  @ApiPropertyOptional({ example: false, required: false })
  @IsOptional()
  @ValidateIf((o) => o.screenedHepB === true)
  @IsBoolean()
  hepBPositive?: boolean;

  @ApiProperty({ example: true, required: true })
  @IsBoolean()
  screenedHepC: boolean;

  @ApiPropertyOptional({ example: false, required: false })
  @IsOptional()
  @ValidateIf((o) => o.screenedHepC === true)
  @IsBoolean()
  hepCPositive?: boolean;

  @ApiProperty({ example: true, required: true })
  @IsBoolean()
  screenedThalassemia: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @ValidateIf((o) => o.screenedThalassemia === true)
  @IsBoolean()
  thalassemiaPositive?: boolean;

  @ApiProperty({ example: true, required: true })
  @IsBoolean()
  screenedHiv: boolean;

  @ApiPropertyOptional({ example: false, required: false })
  @IsOptional()
  @ValidateIf((o) => o.screenedHiv === true)
  @IsBoolean()
  hivPositive?: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  prescribedLabTest: boolean;

  @ApiPropertyOptional({
    example: [
      { name: LabTest.CBC, urgency: LabTestUrgency.ROUTINE },
      { name: LabTest.HEPATITIS_B_HBSAG, urgency: LabTestUrgency.URGENT },
    ],
    required: false,
    type: [LabTestItemDto],
  })
  @IsOptional()
  @ValidateIf((o) => o.prescribedLabTest === true)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LabTestItemDto)
  labTests?: LabTestItemDto[];
}
