import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BloodGroup, MaritalStatus } from 'src/common/enums/enums';

export class CreatePatientAdditionalInfoDto {
  @ApiProperty({
    enum: MaritalStatus,
    example: MaritalStatus.SINGLE,
    description: 'Marital status of the patient',
  })
  @IsEnum(MaritalStatus)
  marital_status: MaritalStatus;

  @ApiProperty({
    enum: BloodGroup,
    example: BloodGroup.O_POS,
    description: 'Blood group of the patient',
  })
  @IsOptional()
  @IsEnum(BloodGroup)
  blood_group: BloodGroup;

  @ApiProperty({
    example: 'name of father',
    description: 'Name of the legal guardian of patient',
  })
  @IsString()
  @MaxLength(25)
  guardian_name: string;
}
