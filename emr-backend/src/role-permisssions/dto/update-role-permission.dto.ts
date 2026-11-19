import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsObject, IsOptional } from 'class-validator';

export class UpdateRolePermissionDto {
  @ApiPropertyOptional({ example: 2, description: 'Role ID to associate' })
  @IsOptional()
  @IsNumber()
  roleId?: number;

  @ApiProperty({
    description: 'The specific permission payload as an array of objects',
    example: [{ name: 'John Doe' }, { name: 'Jane Doe' }],
    type: 'array',
  })
  @IsArray()
  @IsObject({ each: true })
  payload: Record<string, any>[];
}
