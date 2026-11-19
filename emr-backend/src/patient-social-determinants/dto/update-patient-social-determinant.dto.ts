import { PartialType } from '@nestjs/swagger';
import { CreatePatientSocialDeterminantDto } from './create-patient-social-determinant.dto';

export class UpdatePatientSocialDeterminantDto extends PartialType(
  CreatePatientSocialDeterminantDto,
) {}
