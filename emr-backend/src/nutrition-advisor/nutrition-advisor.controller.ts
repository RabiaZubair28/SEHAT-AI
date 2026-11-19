import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtUserAuthGuard } from 'src/auth/jwt-user-auth.guard';
import {
  CreateDeliveryDto,
  GeneratePlanDto,
  OverviewPreviewDto,
  ReviewPlanDto,
  UpdatePlanDto,
} from './dto/nutrition-advisor.dto';
import { MealSlot } from '@health-advisor/modules/nutrition-advisor/models/types';
import { NutritionAdvisorService } from './nutrition-advisor.service';

const userOf = (request: any) => request.user;

@ApiTags('Nutrition Advisor')
@Controller('nutrition-advisor')
@UseGuards(JwtUserAuthGuard)
export class NutritionAdvisorController {
  constructor(private readonly advisorService: NutritionAdvisorService) {}

  @Get('foods')
  @ApiOperation({ summary: 'Validated food library used by the Nutrition Advisor' })
  getFoods() {
    return this.advisorService.getFoodLibrary();
  }

  @Get('reviews')
  @ApiOperation({ summary: 'Nutrition plans awaiting clinical review at the user\'s facility' })
  listReviewQueue(@Req() request: Request) {
    return this.advisorService.listReviewQueue(userOf(request));
  }

  @Get(':appointment_service_id/overview')
  @ApiOperation({ summary: 'Patient summary, targets, findings and recommendations for a Nutrition encounter' })
  getOverview(@Req() request: Request, @Param('appointment_service_id', ParseIntPipe) id: number) {
    return this.advisorService.getOverview(id, userOf(request));
  }

  @Post(':appointment_service_id/overview')
  @ApiOperation({ summary: 'Preview patient findings and targets for proposed Nutrition Advisor preferences' })
  previewOverview(
    @Req() request: Request,
    @Param('appointment_service_id', ParseIntPipe) id: number,
    @Body() dto: OverviewPreviewDto,
  ) {
    return this.advisorService.getOverview(id, userOf(request), dto.preferences, dto.nutritionInput);
  }

  @Get(':appointment_service_id/plans/current')
  @ApiOperation({ summary: 'Latest meal plan version for a Nutrition encounter' })
  getCurrentPlan(@Req() request: Request, @Param('appointment_service_id', ParseIntPipe) id: number) {
    return this.advisorService.getCurrentPlan(id, userOf(request));
  }

  @Get(':appointment_service_id/plans')
  @ApiOperation({ summary: 'All meal plan versions for a Nutrition encounter' })
  listVersions(@Req() request: Request, @Param('appointment_service_id', ParseIntPipe) id: number) {
    return this.advisorService.listVersions(id, userOf(request));
  }

  @Post(':appointment_service_id/plans')
  @ApiOperation({ summary: 'Generate a new 7-day meal plan draft' })
  generatePlan(
    @Req() request: Request,
    @Param('appointment_service_id', ParseIntPipe) id: number,
    @Body() dto: GeneratePlanDto,
  ) {
    return this.advisorService.generatePlan(id, dto, userOf(request));
  }

  @Get('plans/:plan_id')
  @ApiOperation({ summary: 'Get a specific meal plan version' })
  getPlan(@Req() request: Request, @Param('plan_id', ParseIntPipe) planId: number) {
    return this.advisorService.getPlan(planId, userOf(request));
  }

  @Get('plans/:plan_id/substitutes')
  @ApiOperation({ summary: 'Safe substitutes for a food in a meal slot' })
  getSubstitutes(
    @Req() request: Request,
    @Param('plan_id', ParseIntPipe) planId: number,
    @Query('foodId') foodId: string,
    @Query('slot') slot: MealSlot,
  ) {
    return this.advisorService.suggestSwaps(planId, foodId, slot, userOf(request));
  }

  @Patch('plans/:plan_id')
  @ApiOperation({ summary: 'Save draft edits (approved versions create a new draft version)' })
  updatePlan(
    @Req() request: Request,
    @Param('plan_id', ParseIntPipe) planId: number,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.advisorService.updatePlan(planId, dto, userOf(request));
  }

  @Post('plans/:plan_id/submit')
  @ApiOperation({ summary: 'Submit a draft plan for clinical review' })
  submit(@Req() request: Request, @Param('plan_id', ParseIntPipe) planId: number) {
    return this.advisorService.submitForReview(planId, userOf(request));
  }

  @Post('plans/:plan_id/review')
  @ApiOperation({ summary: 'Approve, reject or request changes to a specific plan version' })
  review(
    @Req() request: Request,
    @Param('plan_id', ParseIntPipe) planId: number,
    @Body() dto: ReviewPlanDto,
  ) {
    return this.advisorService.reviewPlan(planId, dto, userOf(request));
  }

  @Get('plans/:plan_id/deliveries')
  @ApiOperation({ summary: 'Delivery history for the encounter of this plan' })
  listDeliveries(@Req() request: Request, @Param('plan_id', ParseIntPipe) planId: number) {
    return this.advisorService.listDeliveries(planId, userOf(request));
  }

  @Post('plans/:plan_id/deliveries')
  @ApiOperation({ summary: 'Record a download or send the approved handout via WhatsApp' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateDeliveryDto })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 15 * 1024 * 1024 } }))
  createDelivery(
    @Req() request: Request,
    @Param('plan_id', ParseIntPipe) planId: number,
    @Body() dto: CreateDeliveryDto,
    @UploadedFile() file: { buffer: Buffer; mimetype: string; size: number },
  ) {
    return this.advisorService.createDelivery(planId, dto, file, userOf(request));
  }
}
