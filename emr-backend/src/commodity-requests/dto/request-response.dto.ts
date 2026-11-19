import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MedicineUnit, RoleName } from 'src/common/enums/enums';
import { RequestStatus, IssuedTo, Purpose } from '../../common/enums/enums';

export class MedicineVariantInfo {
  @ApiProperty({ example: 12 })
  id: number;

  @ApiProperty({ example: 'Paracetamol' })
  medicineName: string;

  @ApiPropertyOptional({ example: 'Acetaminophen' })
  genericName?: string;

  @ApiProperty({ example: '500' })
  strength: string;

  @ApiProperty({ enum: MedicineUnit, example: MedicineUnit.TABLET })
  unit: MedicineUnit;

  @ApiProperty({ example: 'Analgesic' })
  category: string;

  @ApiProperty({ example: false })
  isContraceptive: boolean;
}

export class RequestItemResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ type: () => MedicineVariantInfo })
  medicineVariant: MedicineVariantInfo;

  @ApiProperty({ example: 10 })
  quantityRequested: number;

  @ApiPropertyOptional({ example: 8 })
  quantityDispensed?: number;

  @ApiProperty({ enum: Purpose, example: Purpose.EMERGENCY_USE })
  purpose: Purpose;

  @ApiProperty({ enum: RequestStatus, example: RequestStatus.APPROVED })
  status: RequestStatus;

  @ApiPropertyOptional({ example: 'Partial fulfillment' })
  notes?: string;
}

export class RequestResponseDto {
  @ApiProperty({ example: 101 })
  id: number;

  @ApiProperty({ enum: RoleName, example: RoleName.SBA })
  initiatorRole: RoleName;

  @ApiProperty({ example: 123 })
  requesterId: number;

  @ApiPropertyOptional({ example: 10 })
  facilityId?: number | null;

  @ApiProperty({ example: 'John Doe' })
  requesterName: string;

  @ApiPropertyOptional({ enum: IssuedTo, example: IssuedTo.SBA })
  issuedTo?: string;

  @ApiPropertyOptional({ example: 456 })
  issuedToStaffId?: number;

  @ApiPropertyOptional({ enum: IssuedTo, example: IssuedTo.DISPENSER })
  issueFrom: string;

  @ApiProperty({ type: [RequestItemResponseDto] })
  items: RequestItemResponseDto[];

  @ApiProperty({ enum: RequestStatus, example: RequestStatus.APPROVED })
  status: RequestStatus;

  @ApiPropertyOptional({ example: 789 })
  processedById?: number;

  @ApiPropertyOptional({ example: 'John Doe' })
  approvedBy?: string | null;

  @ApiPropertyOptional({ example: 'John Doe' })
  rejectedBy?: string | null;

  @ApiPropertyOptional()
  processedAt?: Date;

  @ApiPropertyOptional({ example: 'Insufficient stock' })
  rejectionReason?: string;

  @ApiPropertyOptional({ example: 'Partial fulfillment approved' })
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ example: 3 })
  totalItems: number;

  @ApiProperty({ example: 25 })
  totalQuantityRequested: number;

  @ApiProperty({ example: 20 })
  totalQuantityDispensed: number;
}
