import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function NotOlderThan10Months(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'NotOlderThan10Months',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (!value) return false;
          const lmp = new Date(value);
          const tenMonthsAgo = new Date();
          tenMonthsAgo.setMonth(tenMonthsAgo.getMonth() - 10);

          return lmp >= tenMonthsAgo;
        },
        defaultMessage() {
          return 'lmp cannot be older than 10 months from today';
        },
      },
    });
  };
}
