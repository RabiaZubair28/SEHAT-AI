import {
  Injectable,
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import * as sanitizeHtml from 'sanitize-html';

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    return this.sanitize(value);
  }

  private sanitize(value: any): any {
    if (Array.isArray(value)) {
      return value.map((v) => this.sanitize(v));
    }

    if (value !== null && typeof value === 'object') {
      for (const key in value) {
        if (typeof value[key] === 'string') {
          const original = value[key];
          const cleaned = sanitizeHtml(original, {
            allowedTags: [],
            allowedAttributes: {},
            allowedSchemes: [],
          }).trim();

          if (cleaned === '') {
            throw new BadRequestException(
              `Field "${key}" contains unsafe content or becomes empty after sanitization.`,
            );
          }

          value[key] = cleaned;
        } else if (typeof value[key] === 'object') {
          value[key] = this.sanitize(value[key]);
        }
      }
    }

    return value;
  }
}
