import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsArray,
  ArrayUnique,
  IsBoolean,
  ValidateIf,
  IsOptional,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { BreastfeedingIssue } from 'src/common/enums/enums';

export class CreateBreastfeedingDto {
  @ApiProperty({
    example: true,
    description:
      'Did the patient initiate early breastfeeding within the first one hour of delivery? (PNC 1 visit)',
  })
  @IsBoolean()
  @IsOptional()
  early_breastfeeding: boolean;

  @ApiProperty({
    example: true,
    description:
      'Did the patient initiate exclusive breastfeeding for the first six months?',
  })
  @IsBoolean()
  exclusive_breastfeeding: boolean;

  @ApiProperty({
    example: true,
    description: 'Did the patient report any issue with breastfeeding?',
  })
  @IsBoolean()
  reported_issue_with_breastfeeding: boolean;

  @ApiPropertyOptional({
    enum: BreastfeedingIssue,
    isArray: true,
    example: [
      BreastfeedingIssue.SORE_NIPPLES,
      BreastfeedingIssue.NOT_ENOUGH_MILK,
    ],
    description:
      'What type of issues is she facing? (Required only if reported_issue_with_breastfeeding = Yes)',
  })
  @IsArray()
  @IsOptional()
  @ValidateIf((o) => o.reported_issue_with_breastfeeding === true)
  @ArrayUnique()
  @IsEnum(BreastfeedingIssue, { each: true })
  breastfeeding_issues?: BreastfeedingIssue[];

  @ApiPropertyOptional({
    example: 'Baby has difficulty latching due to inverted nipples',
    description:
      'Required if reported_issue_with_breastfeeding is true and breastfeeding_issues includes OTHER',
  })
  @ValidateIf(
    (o) =>
      o.reported_issue_with_breastfeeding === true &&
      o.breastfeeding_issues?.includes(BreastfeedingIssue.OTHER),
  )
  @IsNotEmpty({
    message:
      'otherBreastfeedingIssue is required when breastfeeding_issues includes OTHER',
  })
  @IsString()
  otherBreastfeedingIssue?: string;
}
