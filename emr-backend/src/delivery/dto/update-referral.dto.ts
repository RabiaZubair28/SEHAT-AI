import { PartialType } from '@nestjs/mapped-types';
import { CreateReferralDetailsDto } from './referral.dto';

export class UpdateReferralDetailsDto extends PartialType(CreateReferralDetailsDto) {}
