import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
} from 'class-validator';

export class CreatePostpartumNutritionDto {
  @ApiProperty({
    example: true,
  })
  @IsBoolean()
  counselledOnNutrition: boolean;
}
