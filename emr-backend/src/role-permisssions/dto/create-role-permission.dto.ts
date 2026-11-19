import { IsArray, IsNumber, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRolePermissionDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the role to which permissions are being assigned',
    type: Number,
  })
  @IsNumber()
  roleId: number;

  @ApiProperty({
    description: 'The specific permission payload as an array of objects',
    example: [{ name: 'John Doe' }, { name: 'Jane Doe' }],
    type: 'array',
  })
  @IsArray()
  @IsObject({ each: true })
  payload: Record<string, any>[];
}
