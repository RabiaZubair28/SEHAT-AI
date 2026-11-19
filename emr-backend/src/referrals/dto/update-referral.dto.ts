import { PartialType } from '@nestjs/swagger';
import { CreateInternalReferralDto } from './create-internal-referral.dto';

export class UpdateReferralDto extends PartialType(CreateInternalReferralDto) {}
