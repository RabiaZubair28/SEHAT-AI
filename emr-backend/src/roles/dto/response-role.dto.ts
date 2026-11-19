import { ApiProperty } from '@nestjs/swagger';
import { RoleName } from 'src/common/enums/enums';

export class ResponseRoleDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: RoleName })
  name: RoleName;

  @ApiProperty()
  description: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty({ type: [String] })
  guards: string[];
}
