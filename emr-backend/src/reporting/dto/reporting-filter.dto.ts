import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { DeliveryProgressStatus, Gender, ImmunisationReportFilterType, ReportExportType, ServiceType, TypeOfDelivery } from 'src/common/enums/enums';

export class ReportingFilterDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Facility ID',
    type: Number,
  })
  @IsOptional()
  @Transform(({ value, obj }) => {
    const raw = value ?? obj?.facility_id;
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, { toClassOnly: true })
  @IsInt()
  @IsPositive()
  @IsOptional()
  facilityId?: number;

  @ApiPropertyOptional({
    description: 'Facility ID (snake_case alias)',
    type: Number,
  })
  @IsOptional()
  @Transform(({ value, obj }) => {
    const raw = value ?? obj?.facilityId;
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, { toClassOnly: true })
  @IsInt()
  @IsPositive()
  facility_id?: number;

  @ApiPropertyOptional({
    description: 'Generic patient id for detailed report lookups',
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  @IsInt()
  patientId?: number;

  @ApiPropertyOptional({
    description: 'Optional visit id (compatible with patients/:id/visits/:visitId/:serviceType pattern)',
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  @IsInt()
  visitId?: number;

  @ApiPropertyOptional({
    enum: ServiceType,
    description: 'Optional service type for patient-visit scoped report',
  })
  @IsOptional()
  @IsEnum(ServiceType)
  serviceType?: ServiceType;

  @ApiPropertyOptional({ description: 'Search by name, MR number, CNIC or phone' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ description: 'YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Filter by doctor id' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  @IsInt()
  doctorId?: number;

  @ApiPropertyOptional({ description: 'Filter by medicine name' })
  @IsOptional()
  @IsString()
  medicineName?: string;

  @ApiPropertyOptional({ description: 'Filter by medicine variant id' })
  @IsOptional()
  @Transform(({ value, obj }) => {
    const raw = value ?? obj?.variant_id;
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, { toClassOnly: true })
  @IsInt()
  @IsPositive()
  variantId?: number;

  @ApiPropertyOptional({
    description: 'Filter by medicine variant id (snake_case alias)',
  })
  @IsOptional()
  @Transform(({ value, obj }) => {
    const raw = value ?? obj?.variantId;
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, { toClassOnly: true })
  @IsInt()
  @IsPositive()
  variant_id?: number;

  @ApiPropertyOptional({ description: 'Filter by vaccine name' })
  @IsOptional()
  @Transform(({ value, obj }) => {
    const raw = value ?? obj?.vaccineId;
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, { toClassOnly: true })
  @IsInt()
  @IsPositive()
  vaccineId?: number;

  @ApiPropertyOptional({ description: 'Filter by vaccine code' })
  @IsOptional()
  @IsString()
  vaccineCode?: string;

  @ApiPropertyOptional({ description: 'Filter by division' })
  @IsOptional()
  @Transform(({ value, obj }) => {
    const raw = value ?? obj?.divisionId;
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, { toClassOnly: true })
  @IsInt()
  @IsPositive()
  divisionId?: number;

  @ApiPropertyOptional({ description: 'Filter by district' })
  @IsOptional()
  @Transform(({ value, obj }) => {
    const raw = value ?? obj?.districtId;
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, { toClassOnly: true })
  @IsInt()
  @IsPositive()
  districtId?: number;

  @ApiPropertyOptional({ description: 'Filter by taluka' })
  @IsOptional()
  @Transform(({ value, obj }) => {
    const raw = value ?? obj?.talukaId;
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, { toClassOnly: true })
  @IsInt()
  @IsPositive()
  talukaId?: number;

  @ApiPropertyOptional({ description: 'Filter by union council' })
  @IsOptional()
  @Transform(({ value, obj }) => {
    const raw = value ?? obj?.ucId;
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, { toClassOnly: true })
  @IsInt()
  @IsPositive()
  ucId?: number;

  @ApiPropertyOptional({ enum: ReportExportType, description: 'Export format for the report' })
  @IsOptional()
  @IsEnum(ReportExportType)
  exportType?: ReportExportType;

  @ApiPropertyOptional({
    description: 'Include date-wise medicine usage breakdown',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true', {
    toClassOnly: true,
  })
  @IsBoolean()
  includeDateWiseUsage?: boolean = false;

  @ApiPropertyOptional({
    enum: ImmunisationReportFilterType,
    description:
      'Export-only immunisation filter by patient type (Defaulter, Scheduled, No Dose). Requires exportType, dateFrom, and dateTo.',
  })
  @IsOptional()
  @IsEnum(ImmunisationReportFilterType)
  immunisationType?: ImmunisationReportFilterType;

  @ApiPropertyOptional({ enum: DeliveryProgressStatus, description: 'Filter delivery report by delivery progress status.' })
  @IsOptional()
  @IsEnum(DeliveryProgressStatus)
  deliveryProgressStatus?: DeliveryProgressStatus;

  @ApiPropertyOptional({ enum: TypeOfDelivery, description: 'Filter delivery report by type of delivery.' })
  @IsOptional()
  @IsEnum(TypeOfDelivery)
  TypeOfDelivery?: TypeOfDelivery;
}
