import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { CreateDeliveryDto } from 'src/delivery/dto/create-delivery.dto';
import { ReferralPerson } from '../enums/enums';

@ValidatorConstraint({ name: 'MatchNewbornReferralCount', async: false })
export class MatchNewbornReferralCount implements ValidatorConstraintInterface {
  validate(deliveryDto: CreateDeliveryDto, args: ValidationArguments) {
    const referrals = deliveryDto.referralDetails ?? [];
    const newborns = deliveryDto.newbornAssessments ?? [];

    for (const referral of referrals) {
      if (referral.whoRequiresReferral !== ReferralPerson.CHILD) {
        continue; // skip non-child referrals
      }

      const whichChildren = referral.whichChildRequiredReferral
        ? [referral.whichChildRequiredReferral]
        : [];

      const childComplications = referral.childComplications ?? [];

      if (whichChildren.length !== newborns.length ||
        childComplications.length !== newborns.length) {
        return false; // validation fails
      }
    }

    return true; // all good
  }


  defaultMessage(args: ValidationArguments) {
    return `referralDetails.whichChildRequiredReferral and childComplications must have the same number of entries as newbornAssessments`;
  }
}

