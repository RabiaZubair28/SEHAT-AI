import { ArrayUnique, IsInt, IsOptional, ValidateIf, ValidateNested } from 'class-validator';
import { ApiHideProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ImmunisationDosageDto } from './immunisation-dosage.dto';
import { ImmunisationDosageStatus } from 'src/common/enums/enums';

export class CreateImmunisationDto {
  @ApiHideProperty()
  @IsOptional()
  @ValidateIf((dto) => !dto.appointmentId)
  @IsInt()
  patientId: number;

  @ApiPropertyOptional({ example: 1, description: 'Appointment ID' })
  @IsOptional()
  @IsInt()
  appointmentId: number;

  @ApiHideProperty()
  @IsInt()
  @IsOptional()
  service_id: number;

  @ApiPropertyOptional({
    type: [ImmunisationDosageDto],
    example: [
      {
        vaccine_id: 5,
        dateAdministered: '2025-09-10',
        status: ImmunisationDosageStatus.ADMINISTERED,
        latitude: 24.848612,
        longitude: 67.046521,
      },
      {
        vaccine_id: 6,
        dateAdministered: '2025-09-24',
        status: ImmunisationDosageStatus.ADMINISTERED,
          latitude: 24.848612,
        longitude: 67.046521,
      },
    ],
  })
  @ValidateNested({ each: true })
  @ArrayUnique((immune) => immune.vaccine_id, { message: 'Do not replicate vaccines' })
  @Type(() => ImmunisationDosageDto)
  doses: ImmunisationDosageDto[];
}
