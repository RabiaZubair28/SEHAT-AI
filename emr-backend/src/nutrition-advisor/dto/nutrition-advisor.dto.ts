import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateNutritionDto } from '../../nutrition/dto/create-nutrition.dto';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import type { MealPlanContent } from '@health-advisor/modules/nutrition-advisor/models/types';

export class MeasurementCorrectionsDto {
  @ApiPropertyOptional({ example: 80 })
  @IsOptional()
  @IsNumber()
  @Min(25)
  @Max(250)
  weightKg?: number;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @IsNumber()
  @Min(120)
  @Max(230)
  heightCm?: number;

  @ApiPropertyOptional({ example: 'Re-measured today' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}

export class AdvisorPreferencesDto {
  @ApiProperty({ example: ['egg'], isArray: true })
  @IsArray()
  @IsIn(['egg', 'dairy', 'gluten', 'fish', 'peanut', 'tree_nut'], { each: true })
  allergies: ('egg' | 'dairy' | 'gluten' | 'fish' | 'peanut' | 'tree_nut')[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  otherAllergies?: string;

  @ApiProperty({ enum: ['any', 'vegetarian', 'vegetarian_with_egg'] })
  @IsIn(['any', 'vegetarian', 'vegetarian_with_egg'])
  dietType: 'any' | 'vegetarian' | 'vegetarian_with_egg';

  @ApiProperty({ example: ['low_salt'], isArray: true })
  @IsArray()
  @IsIn(['low_salt', 'diabetic', 'low_fat'], { each: true })
  medicalRestrictions: ('low_salt' | 'diabetic' | 'low_fat')[];

  @ApiPropertyOptional({
    enum: ['diabetes', 'hypertension', 'heart_disease', 'chronic_kidney_disease', 'liver_disease', 'dyslipidemia'],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsIn(['diabetes', 'hypertension', 'heart_disease', 'chronic_kidney_disease', 'liver_disease', 'dyslipidemia'], { each: true })
  healthConditions?: ('diabetes' | 'hypertension' | 'heart_disease' | 'chronic_kidney_disease' | 'liver_disease' | 'dyslipidemia')[];

  @ApiProperty({ isArray: true, example: [] })
  @IsArray()
  @IsString({ each: true })
  excludedFoodIds: string[];

  @ApiProperty({ isArray: true, example: [] })
  @IsArray()
  @IsString({ each: true })
  preferredFoodIds: string[];

  @ApiProperty({ enum: ['low', 'medium', 'high'] })
  @IsIn(['low', 'medium', 'high'])
  budget: 'low' | 'medium' | 'high';

  @ApiProperty({ enum: ['sedentary', 'light', 'moderate'] })
  @IsIn(['sedentary', 'light', 'moderate'])
  activityLevel: 'sedentary' | 'light' | 'moderate';

  @ApiPropertyOptional({ example: 'Likes daal chawal, eats one big meal at night' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ type: MeasurementCorrectionsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MeasurementCorrectionsDto)
  measurementCorrections?: MeasurementCorrectionsDto;
}

export class GeneratePlanDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateNutritionDto)
  nutritionInput?: CreateNutritionDto;
  @ApiProperty({ type: AdvisorPreferencesDto })
  @ValidateNested()
  @Type(() => AdvisorPreferencesDto)
  preferences: AdvisorPreferencesDto;
}

export class OverviewPreviewDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateNutritionDto)
  nutritionInput?: CreateNutritionDto;
  @ApiPropertyOptional({ type: AdvisorPreferencesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AdvisorPreferencesDto)
  preferences?: AdvisorPreferencesDto;
}

export class HandoutDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(600) activityGuidance?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(600) activityGuidanceUr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1500) counselingNotes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(800) patientNotes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(800) patientNotesUr?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() followUpDate?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() urduProofread?: boolean;
}

export class UpdatePlanDto {
  @ApiPropertyOptional({ description: '7-day plan: { days: [{ day, meals: [{ slot, time, items: [{ foodId, portions }] }] }] }' })
  @IsOptional()
  @IsObject()
  plan?: MealPlanContent;

  @ApiPropertyOptional({ type: HandoutDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => HandoutDto)
  handout?: HandoutDto;

  @ApiPropertyOptional({ type: AdvisorPreferencesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AdvisorPreferencesDto)
  preferences?: AdvisorPreferencesDto;
}

export class ReviewPlanDto {
  @ApiProperty({ enum: ['approve', 'reject', 'request_changes'] })
  @IsIn(['approve', 'reject', 'request_changes'])
  decision: 'approve' | 'reject' | 'request_changes';

  @ApiProperty({ description: 'Content hash of the exact version being reviewed' })
  @IsString()
  @Matches(/^[a-f0-9]{64}$/)
  contentHash: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

// Multipart form fields arrive as strings.
export class CreateDeliveryDto {
  @ApiProperty({ enum: ['whatsapp', 'download'] })
  @IsIn(['whatsapp', 'download'])
  channel: 'whatsapp' | 'download';

  @ApiProperty({ enum: ['en', 'ur'] })
  @IsIn(['en', 'ur'])
  language: 'en' | 'ur';

  @ApiProperty()
  @IsString()
  @Matches(/^[a-f0-9]{64}$/)
  contentHash: string;

  @ApiPropertyOptional({ example: '+923001234567' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: 'true' })
  @IsOptional()
  @IsIn(['true', 'false'])
  consent?: string;

  @ApiPropertyOptional({ example: 'false', description: 'Number differs from registration but was confirmed with the patient' })
  @IsOptional()
  @IsIn(['true', 'false'])
  recipientVerified?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
