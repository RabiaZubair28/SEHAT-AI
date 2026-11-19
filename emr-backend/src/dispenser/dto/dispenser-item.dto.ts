import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class DispenseItemDto {
  @ApiProperty({ example: 12 })
  @IsInt()
  @IsNotEmpty()
  prescription_id: number;
}
