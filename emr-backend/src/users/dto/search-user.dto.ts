import { IsArray, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { PaginationDto } from 'src/common/utils/pagination.dto';
import { RoleName } from 'src/common/enums/enums';

export class UserSearchDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'Filter by one or more roles',
    enum: RoleName,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(RoleName, { each: true })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const items = Array.isArray(value) ? value : String(value).split(',');
    const normalized = items
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0);
    if (!normalized.length) return undefined;
    const allowed = Object.values(RoleName);
    return normalized.map((item) => {
      const match = allowed.find(
        (role) => role.toLowerCase() === item.toLowerCase(),
      );
      return match ?? item;
    });
  }, { toClassOnly: true })
  roles?: RoleName[];
}
