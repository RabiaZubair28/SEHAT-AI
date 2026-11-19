import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MedicineUnit } from 'src/common/enums/enums';

export class MedicineInventoryVariantDto {
  @ApiProperty({ example: 1 })
  variantId: number;

  @ApiProperty({ example: '500mg' })
  strength: string;

  @ApiProperty({ enum: MedicineUnit, example: MedicineUnit.TABLET })
  unit: MedicineUnit;

  @ApiProperty({ example: 120 })
  totalQuantity: number;

  @ApiProperty({ example: 4 })
  availableBatches: number;
}

export class MedicineInventoryResponseDto {
  @ApiProperty({ example: 1 })
  medicineId: number;

  @ApiProperty({ example: 'Paracetamol' })
  medicineName: string;

  @ApiPropertyOptional({ example: 'Acetaminophen' })
  genericName?: string;

  @ApiProperty({ example: 'Analgesic' })
  category: string;

  @ApiProperty({ example: false })
  isContraceptive: boolean;

  @ApiProperty({ type: [MedicineInventoryVariantDto] })
  variants: MedicineInventoryVariantDto[];
}
