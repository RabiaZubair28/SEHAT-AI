import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MedicineBatchVariantDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  unit: string;

  @ApiProperty()
  strength: string;

  @ApiPropertyOptional()
  otc?: boolean;

  @ApiPropertyOptional()
  limit_quantity?: number | null;
}

export class MedicineBatchFacilityDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}

export class MedicineBatchMedicineDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}

export class MedicineBatchResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  batch_number: string;

  @ApiProperty()
  expiry_date: Date;

  @ApiProperty({ nullable: true })
  purchase_date: Date | null;

  @ApiProperty()
  stock_quantity: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ nullable: true })
  updatedAt: Date | null;

  @ApiProperty({ type: MedicineBatchVariantDto })
  variant: MedicineBatchVariantDto;

  @ApiProperty({ type: MedicineBatchFacilityDto })
  facility: MedicineBatchFacilityDto;

  @ApiProperty({ type: MedicineBatchMedicineDto })
  medicine: MedicineBatchMedicineDto;

  @ApiProperty()
  isEditable: boolean;

  @ApiProperty()
  isDeletable: boolean;
}
