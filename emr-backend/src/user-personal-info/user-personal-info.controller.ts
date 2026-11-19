import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UserPersonalInfoService } from './user-personal-info.service';
import { CreateUserPersonalInfoDto } from './dto/create-user-personal-info.dto';
import { UpdateUserPersonalInfoDto } from './dto/update-user-personal-info.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('User Personal Info')
@ApiBearerAuth()
@Controller('user-personal-info')
export class UserPersonalInfoController {
  constructor(
    private readonly userPersonalInfoService: UserPersonalInfoService,
  ) {}
}
