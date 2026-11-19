import { ApiProperty } from '@nestjs/swagger';

export class DefaultPermissionResponseDto {
  @ApiProperty({
    description: 'Route path pattern matched against the request path',
    example: '/user-permissions/',
  })
  route: string;

  @ApiProperty({
    description: 'HTTP method',
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    example: 'GET',
  })
  method: string;
}