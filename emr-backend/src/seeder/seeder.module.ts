import { Module } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { Division } from '../division/entities/division.entity';
import { District } from '../districts/entities/district.entity';
import { Facility } from '../facilities/entities/facility.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DivisionSeeder } from './division/division.seeder';
import { DistrictSeeder } from './district/district.seeder';
import { FacilitySeeder } from './facility/facility.seeder';
import { Role } from 'src/roles/entities/role.entity';
import { RoleSeeder } from './role/role.seeder';
import { PermissionSeeder } from './permission/permission.seeder';
import { Permission } from 'src/permissions/entities/permission.entity';
import { User } from 'src/users/entities/user.entity';
import { UserSeeder } from './user/user.seeder';
import { UserPersonalInfo } from 'src/user-personal-info/entities/user-personal-info.entity';
import { UserPersonalInfoSeeder } from './userPersonalnfo/userPersonalInfo.seeder';
import { UserPermission } from '../user-permissions/entities/user-permission.entity';
import { UserPermissionSeeder } from './userPermission/userPermission.seeder';
import * as dotenv from 'dotenv';
import { createDataSource } from 'src/data-source';
import { Taluka } from 'src/taluka/entities/taluka.entity';
import { TalukaSeeder } from './taluka/taluka.seeder';
import { UC } from 'src/uc/entities/uc.entity';
import { UcSeeder } from './uc/uc.seeder';
import { Service } from 'src/services/entities/service.entity';
import { UserServiceSeeder } from './userService/userService.seeder';
import { ServiceSeeder } from './service/service.seeder';
import { RolePermission } from 'src/role-permisssions/entities/role-permisssion.entity';
import { RolePermissionSeeder } from './rolePermission/rolePermission.seeder';
import { UserService as UserServiceEntity } from 'src/user-services/entities/user-service.entity';
import { Medicine } from 'src/medicine/entities/medicine.entity';
import { MedicineBatch } from 'src/medicine/entities/medicine-batch.entity';
import { MedicineVariant } from 'src/medicine/entities/medicine-variant.entity';
import { MedicineSeeder } from './medicine/medicine.seeder';
import { MisMedicinesSeeder } from './medicine/mis-medicines.seeder';
import VaccineSeeder from './vaccine/vaccine.seeder';
import { Vaccine } from 'src/immunisation/entities/vaccine.entity';
import { MedicineCount } from 'src/medicine-batch/entities/medicine-count.entity';
import { Client } from 'src/clients/entities/client.entity';
import { ClientSeeder } from './client/client.seeder';
import { Province } from 'src/province/entities/province.entity';
import { LocationSeeder } from './location/location.seeder';
import { ProvinceSeeder } from './province/province.seeder';


dotenv.config();

const dataSource = createDataSource(true);

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSource.options),
    TypeOrmModule.forFeature([
      Division,
      District,
      Facility,
      Role,
      Permission,
      User,
      UserPersonalInfo,
      Medicine,
      MedicineBatch,
      MedicineVariant,
      UserPermission,
      RolePermission,
      Taluka,
      UC,
      Role,
      Service,
      UserServiceEntity,
      Vaccine,
      MedicineCount,
      Client,
      Province,

    ]),
  ],
  providers: [
    ProvinceSeeder,
    DivisionSeeder,
    DistrictSeeder,
    FacilitySeeder,
    RoleSeeder,
    PermissionSeeder,
    UserSeeder,
    UserPersonalInfoSeeder,
    RolePermissionSeeder,
    TalukaSeeder,
    UcSeeder,
    UserPermissionSeeder,
    ServiceSeeder,
    UserServiceSeeder,
    MedicineSeeder,
    MisMedicinesSeeder,
    VaccineSeeder,
    ClientSeeder,
    LocationSeeder,
    SeederService,
  ],
})
export class SeederModule { }
