import { PartialType } from '@nestjs/swagger';
import { CreatePostpartumNutritionDto } from './create-postpartum-nutrition.dto';

export class UpdatePostpartumNutritionDto extends PartialType(
  CreatePostpartumNutritionDto,
) { }
