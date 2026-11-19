import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { TokenCounterService } from './token-counter.service';
import { JwtUserAuthGuard } from 'src/auth/jwt-user-auth.guard';

@Controller('token-counter')
export class TokenCounterController {
  constructor(private readonly tokenCounterService: TokenCounterService) {}

  @Get()
  @UseGuards(JwtUserAuthGuard)
  getNextToken() {
    return this.tokenCounterService.getNextToken();
  }
}
