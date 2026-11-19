import { Injectable } from '@nestjs/common';
import { CreatePatientSocialDeterminantDto } from './dto/create-patient-social-determinant.dto';
import { UpdatePatientSocialDeterminantDto } from './dto/update-patient-social-determinant.dto';

@Injectable()
export class PatientSocialDeterminantsService {
  create(createPatientSocialDeterminantDto: CreatePatientSocialDeterminantDto) {
    return 'This action adds a new patientSocialDeterminant';
  }

  findAll() {
    return `This action returns all patientSocialDeterminants`;
  }

  findOne(id: number) {
    return `This action returns a #${id} patientSocialDeterminant`;
  }

  update(
    id: number,
    updatePatientSocialDeterminantDto: UpdatePatientSocialDeterminantDto,
  ) {
    return `This action updates a #${id} patientSocialDeterminant`;
  }

  remove(id: number) {
    return `This action removes a #${id} patientSocialDeterminant`;
  }
}
