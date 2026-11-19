import { Injectable } from '@nestjs/common';
import { DivisionSeeder } from './division/division.seeder';
import { DistrictSeeder } from './district/district.seeder';
import { FacilitySeeder } from './facility/facility.seeder';
import { RoleSeeder } from './role/role.seeder';
import { PermissionSeeder } from './permission/permission.seeder';
import { UserSeeder } from './user/user.seeder';
import { UserPersonalInfoSeeder } from './userPersonalnfo/userPersonalInfo.seeder';
import { UserPermissionSeeder } from './userPermission/userPermission.seeder';
import { DataSource } from 'typeorm';
import { UserServiceSeeder } from './userService/userService.seeder';
import { ServiceSeeder } from './service/service.seeder';
import { RolePermissionSeeder } from './rolePermission/rolePermission.seeder';
import { MedicineSeeder } from './medicine/medicine.seeder';
import { MisMedicinesSeeder } from './medicine/mis-medicines.seeder';
import VaccineSeeder from './vaccine/vaccine.seeder';
import { LocationSeeder } from './location/location.seeder';
import { TalukaSeeder } from './taluka/taluka.seeder';
import { UcSeeder } from './uc/uc.seeder';
import { ProvinceSeeder } from './province/province.seeder';

@Injectable()
export class SeederService {
  constructor(
    private readonly provinceSeeder: ProvinceSeeder,
    private readonly divisionSeeder: DivisionSeeder,
    private readonly districtSeeder: DistrictSeeder,
    private readonly facilitySeeder: FacilitySeeder,
    private readonly roleSeeder: RoleSeeder,
    private readonly permissionSeeder: PermissionSeeder,
    private readonly userSeeder: UserSeeder,
    private readonly userPersonalInfoSeeder: UserPersonalInfoSeeder,
    private readonly userPermissionSeeder: UserPermissionSeeder,
    private readonly talukaSeeder: TalukaSeeder,
    private readonly ucSeeder: UcSeeder,
    private readonly dataSource: DataSource,
    private readonly userServiceSeeder: UserServiceSeeder,
    private readonly serviceSeeder: ServiceSeeder,
    private readonly rolePermissionSeeder: RolePermissionSeeder,
    private readonly medicineSeeder: MedicineSeeder,
    private readonly misMedicinesSeeder: MisMedicinesSeeder,
    private readonly vaccineSeeder: VaccineSeeder,
    private readonly locationSeeder: LocationSeeder,
  ) {}

  async seed() {
    console.log('🚀 Starting database seeding...');

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.provinceSeeder.seed();
      await this.divisionSeeder.seed();
      await this.districtSeeder.seed();
      await this.talukaSeeder.seed();
      await this.ucSeeder.seed();
      await this.locationSeeder.seed();
      await this.facilitySeeder.seed();
      await this.roleSeeder.seed();
      await this.rolePermissionSeeder.seed();
      await this.permissionSeeder.seed();
      await this.userSeeder.seed();
      await this.userPersonalInfoSeeder.seed();
      await this.userPermissionSeeder.seed();
      await this.serviceSeeder.seed();
      await this.userServiceSeeder.seed();
      await this.medicineSeeder.seed();
      // await this.misMedicinesSeeder.seed();
      await this.vaccineSeeder.seed();

      await queryRunner.commitTransaction();
      console.log('🎉 All seeders executed successfully!');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('❌ Seeding failed. Rolling back changes...', error);
    } finally {
      await queryRunner.release();
    }
  }
}
