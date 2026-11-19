import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { NationalityStatus } from 'src/common/enums/enums';

export function CnicLengthByNationality(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'CnicLengthByNationality',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }

          const { nationalityStatus } = args.object as {
            nationalityStatus?: NationalityStatus;
          };

          if (!nationalityStatus) {
            return true;
          }

          if (nationalityStatus === NationalityStatus.NON_PAKISTANI) {
            return value.length >= 6 && value.length <= 20;
          }

          return value.length === 13;
        },
        defaultMessage(args: ValidationArguments) {
          const { nationalityStatus } = args.object as {
            nationalityStatus?: NationalityStatus;
          };

          if (nationalityStatus === NationalityStatus.NON_PAKISTANI) {
            return 'cnic must be between 6 and 20 characters for Non-Pakistani';
          }

          if (nationalityStatus === NationalityStatus.PAKISTANI) {
            return 'cnic must be 13 characters for Pakistani';
          }

          return 'cnic has an invalid length';
        },
      },
    });
  };
}
