import {
  Controller,
  Post,
  Body,
  Patch,
  UseGuards,
  Param,
} from '@nestjs/common';
import { AncService } from './anc.service';
import { CreateAncDto } from './dto/create-anc.dto';
import { UpdateAncDto } from './dto/update-anc.dto';
import { JwtUserAuthGuard } from 'src/auth/jwt-user-auth.guard';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AncMutateResponseDto } from './dto/anc-mutate-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Controller('anc')
export class AncController {
  constructor(private readonly ancService: AncService) {}

  @Post()
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Submit the ANC Visit details',
    description:
      'Creates a new ANC visit record linked to the authenticated user.',
  })
  @ApiBody({
    type: CreateAncDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Anc visit created successfully',
    type: AncMutateResponseDto,
  })
  createAnc(
    @Body() createAncDto: CreateAncDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ancService.create(createAncDto, user);
  }

  @Patch(':appointment_service_id')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Update an existing ANC Visit',
    description: 'Updates the details of an existing ANC visit record.',
  })
  @ApiResponse({
    status: 200,
    description: 'Anc visit updated successfully',
    type: AncMutateResponseDto,
  })
  update(
    @Param('appointment_service_id') id: string,
    @Body() updateAncDto: UpdateAncDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ancService.update(+id, updateAncDto, user);
  }
}
