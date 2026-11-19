import { PartialType } from '@nestjs/mapped-types';
import { CreateUserPersonalInfoDto } from './create-user-personal-info.dto';

export class UpdateUserPersonalInfoDto extends PartialType(
  CreateUserPersonalInfoDto,
) {}
