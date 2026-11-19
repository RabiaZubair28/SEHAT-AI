import { Injectable } from '@nestjs/common';
import { CreatePatientAdditionalInfoDto } from './dto/create-patient-additional-info.dto';
import { UpdatePatientAdditionalInfoDto } from './dto/update-patient-additional-info.dto';

@Injectable()
export class PatientAdditionalInfoService {
  create(createPatientAdditionalInfoDto: CreatePatientAdditionalInfoDto) {
    return 'This action adds a new patientAdditionalInfo';
  }

  findAll() {
    return `This action returns all patientAdditionalInfo`;
  }

  findOne(id: number) {
    return `This action returns a #${id} patientAdditionalInfo`;
  }

  update(
    id: number,
    updatePatientAdditionalInfoDto: UpdatePatientAdditionalInfoDto,
  ) {
    return `This action updates a #${id} patientAdditionalInfo`;
  }

  remove(id: number) {
    return `This action removes a #${id} patientAdditionalInfo`;
  }
}
