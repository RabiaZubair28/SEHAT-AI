import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class OtcDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  medicine_variant_id: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  @IsNotEmpty()
  quantity: number;
}
