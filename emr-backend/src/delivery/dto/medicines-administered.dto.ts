import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class MedicinesAdministeredDto {
  @ApiProperty({
    example: 1,
    description: 'Medicine variant ID',
  })
  @IsInt()
  medicine_variant_id: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}
