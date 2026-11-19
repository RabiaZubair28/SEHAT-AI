import { PartialType } from '@nestjs/swagger';
import { PncVitalsDto } from 'src/vital-assesment/dto/create-pnc-vital-assesments.dto';

export class UpdateVitalAssesmentDto extends PartialType(PncVitalsDto) {}
