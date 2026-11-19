import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/utils/pagination.dto';

export class FacilityDistrictFiltersDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'When true, return only facilities managed by PPHI',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === 'true') {
      return true;
    }
    if (value === false || value === 'false') {
      return false;
    }
    return value;
  }, { toClassOnly: true })
  @IsBoolean()
  managedByPPHI?: boolean;
}
