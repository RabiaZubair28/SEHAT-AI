import { ApiProperty } from '@nestjs/swagger';
import { CNICProvider, PatientStatus } from '../../common/enums/enums';

export class PatientAppointmentDto {
  @ApiProperty()
  id: number;

  @ApiProperty({
    enum: PatientStatus,
  })
  status: string;
}

export class PatientSearchResultDto {
  @ApiProperty()
  id: number;

  @ApiProperty({
    enum: CNICProvider,
  })
  cnic_provider: CNICProvider;

  @ApiProperty()
  mr_no: string;

  @ApiProperty({ nullable: true })
  immunisation_number?: string | null;

  @ApiProperty()
  first_name: string;

  @ApiProperty()
  last_name: string;

  @ApiProperty({ nullable: true })
  cnic: string | null;

  @ApiProperty()
  phone_number: string;

  @ApiProperty()
  dob: Date;

  @ApiProperty()
  gender: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  division_id: number;

  @ApiProperty()
  district_id: number;

  @ApiProperty({ nullable: true })
  facility_id: number | null;

  @ApiProperty()
  taluka_id: number;

  @ApiProperty({ nullable: true })
  uc_id?: number | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty({ type: [PatientAppointmentDto] })
  appointments: PatientAppointmentDto[];
}

export class PatientSearchResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  status: number;

  @ApiProperty({ type: [PatientSearchResultDto] })
  data: PatientSearchResultDto[];

  @ApiProperty()
  message: string;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  count: number;

  @ApiProperty()
  lastPage: number;
}
