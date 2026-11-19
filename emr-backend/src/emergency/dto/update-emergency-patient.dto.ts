import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { CreateEmergencyPatientDto } from './create-emergency-patient.dto';
import { Gender } from 'src/common/enums/enums';

export class UpdateEmergencyPatientDto extends PartialType(
  CreateEmergencyPatientDto,
) {
  @ApiPropertyOptional({
    enum: Gender,
    example: Gender.FEMALE,
    description: 'Gender of the patient',
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;
}
