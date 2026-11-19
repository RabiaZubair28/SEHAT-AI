import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  ArrayNotEmpty,
  IsInt,
  IsPositive,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreateUserServiceDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the user to assign services to',
  })
  @IsInt()
  @IsPositive()
  user_id: number;

  @ApiProperty({
    example: [1, 2, 3],
    description: 'Array of service IDs to assign to the user',
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  services_ids: number[];

  @IsInt()
  @IsPositive()
  @IsOptional()
  facility_id?: number;
}
