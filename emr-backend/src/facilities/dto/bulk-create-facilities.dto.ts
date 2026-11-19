import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidationError,
} from 'class-validator';
import { LevelOfCare } from 'src/common/enums/enums';

export const BULK_FACILITIES_MAX_ROWS = 100;

const BOOLEAN_TRUE_TOKENS = ['true', '1', 'yes', 'y'];
const BOOLEAN_FALSE_TOKENS = ['false', '0', 'no', 'n'];
const LEVEL_OF_CARE_VALUES = Object.values(LevelOfCare);
const LEVEL_OF_CARE_LABEL = LEVEL_OF_CARE_VALUES.join(', ');

const trimTransform = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

const optionalTrimTransform = ({ value }: TransformFnParams): unknown => {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

const optionalNumberTransform = ({ value }: TransformFnParams): unknown => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return undefined;
    const parsed = Number(trimmed);
    // Leave non-numeric values untouched so the validator reports them.
    return Number.isNaN(parsed) ? value : parsed;
  }
  return value;
};

const optionalBooleanTransform = ({ value }: TransformFnParams): unknown => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === '') return undefined;
    if (BOOLEAN_TRUE_TOKENS.includes(normalized)) return true;
    if (BOOLEAN_FALSE_TOKENS.includes(normalized)) return false;
    // Leave unrecognized tokens untouched so the validator reports them.
    return value;
  }
  return value;
};

const levelOfCareTransform = ({ value }: TransformFnParams): unknown => {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  const match = LEVEL_OF_CARE_VALUES.find(
    (level) => level.toLowerCase() === trimmed.toLowerCase(),
  );
  return match ?? value;
};

/**
 * One pasted grid row. Every value arrives as a string; the transforms above
 * coerce well-formed values and leave invalid ones in place so class-validator
 * reports a per-field error.
 *
 * NOTE: rows are validated in BulkFacilitiesService (not via @ValidateNested
 * on the container DTO) because the global ValidationPipe flattens nested
 * errors into strings, which would lose the row/field information the UI needs
 * to highlight cells.
 */
export class BulkFacilityRowDto {
  @ApiProperty({
    example: 'Karachi',
    description: 'Division name; validated against the district when provided',
    required: false,
  })
  @Transform(optionalTrimTransform)
  @IsOptional()
  @IsString({ message: 'must be a text value' })
  @MaxLength(255, { message: 'must be at most 255 characters' })
  division?: string;

  @ApiProperty({ example: '1043', description: 'Unique facility code' })
  @Transform(optionalNumberTransform)
  @IsOptional()
  @IsNumber({}, { message: 'must be a number' })
  @Min(0, { message: 'must be a positive number' })
  facility_code?: number;

  @ApiProperty({ example: 'Korangi', description: 'District name' })
  @Transform(trimTransform)
  @IsString({ message: 'must be a text value' })
  @IsNotEmpty({ message: 'is required' })
  @MaxLength(255, { message: 'must be at most 255 characters' })
  district: string;

  @ApiProperty({
    example: 'Gulshan-e-Iqbal',
    description: 'Taluka name within the district',
    required: false,
  })
  @Transform(optionalTrimTransform)
  @IsOptional()
  @IsString({ message: 'must be a text value' })
  @MaxLength(255, { message: 'must be at most 255 characters' })
  taluka?: string;

  @ApiProperty({
    example: 'Gulshan-e-Iqbal Town I',
    description: 'Union council name',
    required: false,
  })
  @Transform(optionalTrimTransform)
  @IsOptional()
  @IsString({ message: 'must be a text value' })
  @MaxLength(255, { message: 'must be at most 255 characters' })
  union_council?: string;

  @ApiProperty({ example: 'Basic Health Unit Korangi No 5' })
  @Transform(trimTransform)
  @IsString({ message: 'must be a text value' })
  @IsNotEmpty({ message: 'is required' })
  @MaxLength(255, { message: 'must be at most 255 characters' })
  facility_name: string;

  @ApiProperty({ example: 'BHU', required: false })
  @Transform(optionalTrimTransform)
  @IsOptional()
  @IsString({ message: 'must be a text value' })
  @MaxLength(10, { message: 'must be at most 10 characters' })
  facility_type?: string;

  @ApiProperty({ example: 'PPHI', required: false })
  @Transform(optionalTrimTransform)
  @IsOptional()
  @IsString({ message: 'must be a text value' })
  @MaxLength(10, { message: 'must be at most 10 characters' })
  managed_by?: string;

  @ApiProperty({ example: 'yes', required: false })
  @Transform(optionalBooleanTransform)
  @IsOptional()
  @IsBoolean({
    message: 'must be one of: true, false, 1, 0, yes, no, y, n',
  })
  is_24_7?: boolean;

  @ApiProperty({ example: 'true', required: false })
  @Transform(optionalBooleanTransform)
  @IsOptional()
  @IsBoolean({
    message: 'must be one of: true, false, 1, 0, yes, no, y, n',
  })
  bmu?: boolean;

  @ApiProperty({ example: '0', required: false })
  @Transform(optionalBooleanTransform)
  @IsOptional()
  @IsBoolean({
    message: 'must be one of: true, false, 1, 0, yes, no, y, n',
  })
  otp?: boolean;

  @ApiProperty({ example: 'false', required: false })
  @Transform(optionalBooleanTransform)
  @IsOptional()
  @IsBoolean({
    message: 'must be one of: true, false, 1, 0, yes, no, y, n',
  })
  nsc?: boolean;

  @ApiProperty({ example: '24.8615', required: false })
  @Transform(optionalNumberTransform)
  @IsOptional()
  @IsLatitude({ message: 'must be a valid latitude between -90 and 90' })
  lat?: number;

  @ApiProperty({ example: '67.1167', required: false })
  @Transform(optionalNumberTransform)
  @IsOptional()
  @IsLongitude({ message: 'must be a valid longitude between -180 and 180' })
  long?: number;

  @ApiProperty({ example: 'Primary', required: false })
  @Transform(levelOfCareTransform)
  @IsOptional()
  @IsIn(LEVEL_OF_CARE_VALUES, {
    message: `must be one of: ${LEVEL_OF_CARE_LABEL}`,
  })
  level_of_care?: LevelOfCare;
}

export class BulkCreateFacilitiesDto {
  @ApiProperty({
    type: [BulkFacilityRowDto],
    description: 'Facility rows to create; the batch is rejected as a whole if any row is invalid',
  })
  @IsArray({ message: 'facilities must be an array' })
  @ArrayMinSize(1, { message: 'at least one facility row is required' })
  @ArrayMaxSize(BULK_FACILITIES_MAX_ROWS, {
    message: `a maximum of ${BULK_FACILITIES_MAX_ROWS} rows can be submitted at once`,
  })
  facilities: BulkFacilityRowDto[];
}

export interface BulkRowError {
  row: number;
  field: string;
  message: string;
}

/**
 * Converts class-validator's nested ValidationError tree into flat
 * { row, field, message } entries using 1-based row numbers.
 */
export function mapValidationErrorsToRowErrors(
  errors: ValidationError[],
  rowNumber: number,
): BulkRowError[] {
  const results: BulkRowError[] = [];

  const walk = (validationErrors: ValidationError[], prefix: string) => {
    for (const error of validationErrors) {
      const field = prefix ? `${prefix}.${error.property}` : error.property;

      if (error.constraints) {
        const constraintKeys = Object.keys(error.constraints);
        // "is required" reads better than "must be a string" when a
        // required field is simply missing.
        const preferredKey = constraintKeys.includes('isNotEmpty')
          ? 'isNotEmpty'
          : constraintKeys[0];
        results.push({
          row: rowNumber,
          field,
          message: error.constraints[preferredKey],
        });
      }

      if (error.children?.length) {
        walk(error.children, field);
      }
    }
  };

  walk(errors, '');
  return results;
}
