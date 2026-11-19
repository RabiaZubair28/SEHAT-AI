import {
  Controller,
  Body,
  UseGuards,
  Post,
} from '@nestjs/common';
import { DispenserService } from './dispenser.service';
import { CreateDispenserDto } from './dto/create-dispenser.dto';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtUserAuthGuard } from 'src/auth/jwt-user-auth.guard';
import { Dispenser } from './entities/dispenser.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Controller('dispenser')
export class DispenserController {
  constructor(private readonly dispenserService: DispenserService) {}

  @Post()
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Dispense prescribed medicines',
    description:
      'Creates a dispense record for a visit and deducts stock from the selected medicine batches.',
  })
  @ApiBody({ type: CreateDispenserDto })
  @ApiResponse({
    status: 201,
    description: 'Dispense record created successfully',
    type: Dispenser,
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createDispenserDto: CreateDispenserDto,
  ) {
    return this.dispenserService.create(createDispenserDto, user);
  }
}
