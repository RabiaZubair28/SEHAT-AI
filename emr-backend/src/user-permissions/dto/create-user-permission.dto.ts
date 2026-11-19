import { IsArray, IsEnum, IsNumber, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum Status {
  APPROVED = 'approved',
  REJECTED = 'rejected',
}
export class CreateUserPermissionDto {
  @ApiProperty({
    description: 'ID of the user to assign the permission to',
    example: 1,
    type: Number,
  })
  @IsNumber()
  userId: number;

  @ApiProperty({
    description: 'The specific permission payload as an array of objects',
    example: [{ name: 'John Doe' }, { name: 'Jane Doe' }],
    type: 'array',
  })
  @IsArray()
  @IsObject({ each: true })
  payload: Record<string, any>[];

  @ApiProperty({
    enum: Status,
    description: 'Status of the permission',
    example: Status.APPROVED,
  })
  @IsEnum(Status)
  status: Status;
}
