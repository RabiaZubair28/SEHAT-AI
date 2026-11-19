import { Injectable } from '@nestjs/common';
import { CreateDiagnosisPrescriptionDto } from './dto/create-diagnosis-prescription.dto';
import { UpdateDiagnosisPrescriptionDto } from './dto/update-diagnosis-prescription.dto';

@Injectable()
export class DiagnosisPrescriptionsService {
  create(createDiagnosisPrescriptionDto: CreateDiagnosisPrescriptionDto) {
    return 'This action adds a new diagnosisPrescription';
  }

  findAll() {
    return `This action returns all diagnosisPrescriptions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} diagnosisPrescription`;
  }

  update(
    id: number,
    updateDiagnosisPrescriptionDto: UpdateDiagnosisPrescriptionDto,
  ) {
    return `This action updates a #${id} diagnosisPrescription`;
  }

  remove(id: number) {
    return `This action removes a #${id} diagnosisPrescription`;
  }
}
