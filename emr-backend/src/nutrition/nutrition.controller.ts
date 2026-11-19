import {
  Controller,
  Post,
  Body,
  Patch,
  UseGuards,
  Param,
  Req,
} from '@nestjs/common';
import { NutritionService } from './nutrition.service';
import { JwtUserAuthGuard } from 'src/auth/jwt-user-auth.guard';
import { ApiOperation, ApiResponse, ApiBody, ApiTags } from '@nestjs/swagger';
import { CreateNutritionDto } from './dto/create-nutrition.dto';
import { UpdateNutritionDto } from './dto/update-nutrition.dto';

@ApiTags('Nutrition')
@Controller('nutrition')
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  @Post()
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Submit Nutrition service details',
    description:
      'Creates a new Nutrition service record for a patient linked to the authenticated user.',
  })
  @ApiBody({
    type: CreateNutritionDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Nutrition record created successfully',
  })
  createNutrition(
    @Req() request: Request,
    @Body() createNutritionDto: CreateNutritionDto,
  ) {
    return this.nutritionService.create(createNutritionDto, request);
  }

  @Patch(':appointment_service_id')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Update an existing Nutrition record',
    description: 'Updates the details of an existing Nutrition service record.',
  })
  @ApiBody({
    type: UpdateNutritionDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Nutrition record updated successfully',
  })
  update(
    @Req() request: Request,
    @Param('appointment_service_id') id: string,
    @Body() updateNutritionDto: UpdateNutritionDto,
  ) {
    return this.nutritionService.update(+id, updateNutritionDto, request);
  }
}

