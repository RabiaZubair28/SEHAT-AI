import { Injectable } from '@nestjs/common';
import { CreateUserPersonalInfoDto } from './dto/create-user-personal-info.dto';
import { UpdateUserPersonalInfoDto } from './dto/update-user-personal-info.dto';

@Injectable()
export class UserPersonalInfoService {
  create(createUserPersonalInfoDto: CreateUserPersonalInfoDto) {
    return 'This action adds a new userPersonalInfo';
  }

  findAll() {
    return `This action returns all userPersonalInfo`;
  }

  findOne(id: number) {
    return `This action returns a #${id} userPersonalInfo`;
  }

  update(id: number, updateUserPersonalInfoDto: UpdateUserPersonalInfoDto) {
    return `This action updates a #${id} userPersonalInfo`;
  }

  remove(id: number) {
    return `This action removes a #${id} userPersonalInfo`;
  }
}
