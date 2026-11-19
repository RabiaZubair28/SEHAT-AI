import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDate,
  IsOptional,
  IsString,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DischargeChecklist } from 'src/common/enums/enums';

export class CreateDischargeDetailsDto {
  @ApiProperty({
    enum: DischargeChecklist,
    isArray: true,
    nullable: true,
  })
  @IsArray()
  @IsEnum(DischargeChecklist, { each: true })
  @IsOptional()
  dischargeChecklist?: DischargeChecklist[];

  @ApiProperty({
    example: 'Condoms',
    nullable: true,
    description: 'Only required if dischargeChecklist includes family planning commodities',
  })
  @ValidateIf(o => o.dischargeChecklist?.includes(DischargeChecklist.PROVIDED_FAMILY_PLANNING_COMMODITIES))
  @IsString()
  @IsOptional()
  familyPlanningCommodity?: string;

  @ApiProperty({
    example: '2025-11-25',
    nullable: true,
    description: 'Optional follow-up date',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  followUpDate?: Date;
}
