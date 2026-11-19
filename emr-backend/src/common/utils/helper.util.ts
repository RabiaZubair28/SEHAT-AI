import {
  ConflictException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { TIME_DIFF_IN_HOURS } from '../app.constants';

@Injectable()
export class ExceptionUtility {
  /**
   *
   * @param err
   * @param customMessage
   *
   * This is to be used to throw 500 error with custom messages on service/logic layer
   * This is written to keep a central converter for error message.
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public static generateException(err: any, customMessage: string): never {
    if (
      err?.code === '23505' ||
      /duplicate key value violates unique constraint/i.test(err?.message)
    ) {
      throw new ConflictException(
        customMessage || 'Duplicate key value error.',
      );
    } else if (err?.response?.statusCode === HttpStatus.INTERNAL_SERVER_ERROR) {
      throw new InternalServerErrorException(customMessage);
    } else if (!err.statusCode && !err.status) {
      throw new InternalServerErrorException(err?.message || customMessage);
    } else {
      throw err;
    }
  }

  public static timeDifferenceInHoursFromCreation(time: Date): number {
    const createdAt = new Date(time);
    const now = new Date();
    const timeDifferenceInMs = now.getTime() - createdAt.getTime();
    return timeDifferenceInMs / TIME_DIFF_IN_HOURS;
  }
}
