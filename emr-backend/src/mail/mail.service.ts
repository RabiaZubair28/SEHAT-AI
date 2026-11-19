import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { ApiResponseMessages } from 'src/common/api-messages.constants';
import {
  buildForgotPasswordTemplate,
  buildResetPasswordTemplate,
} from './templates/password-mail.templates';

interface ResetPasswordEmailPayload {
  to: string;
  firstName?: string;
  lastName?: string;
  newPassword: string;
}

interface ForgotPasswordEmailPayload {
  to: string;
  firstName?: string;
  lastName?: string;
  resetLink: string;
  expiresIn?: string;
}

@Injectable()
export class MailService implements OnModuleDestroy {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter?: Transporter;
  private readonly fromAddress: string;
  private readonly appName: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('EMAIL_HOST');
    const port = Number(this.configService.get<string>('EMAIL_PORT') ?? 0);
    const user = this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASSWORD');
    const secureSetting = this.configService.get<string>('EMAIL_SECURE');

    const secure =
      secureSetting !== undefined
        ? secureSetting.toLowerCase() === 'true'
        : port === 465;

    this.fromAddress =
      this.configService.get<string>('EMAIL_FROM') ??
      user ??
      'no-reply@example.com';
    this.appName = this.configService.get<string>('APP_NAME') ?? 'EMR';

    if (!host || !port) {
      this.logger.warn(ApiResponseMessages.EMAIL_TRANSPORT_NOT_CONFIGURED);
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async sendResetPasswordEmail(
    payload: ResetPasswordEmailPayload,
  ): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(ApiResponseMessages.EMAIL_TRANSPORT_UNAVAILABLE_RESET);
      return false;
    }

    const template = buildResetPasswordTemplate({
      appName: this.appName,
      firstName: payload.firstName,
      lastName: payload.lastName,
      newPassword: payload.newPassword,
    });

    const from = this.fromAddress.includes('<')
      ? this.fromAddress
      : `${this.appName} <${this.fromAddress}>`;

    try {
      await this.transporter.sendMail({
        from,
        to: payload.to,
        subject: template.subject,
        text: template.text,
        html: template.html,
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `${ApiResponseMessages.SEND_RESET_PASSWORD_EMAIL_FAILED} ${message}`,
      );
      return false;
    }
  }

  async sendForgotPasswordEmail(
    payload: ForgotPasswordEmailPayload,
  ): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(ApiResponseMessages.EMAIL_TRANSPORT_UNAVAILABLE_FORGOT);
      return false;
    }

    const template = buildForgotPasswordTemplate({
      appName: this.appName,
      firstName: payload.firstName,
      lastName: payload.lastName,
      resetLink: payload.resetLink,
      expiresIn: payload.expiresIn,
    });

    const from = this.fromAddress.includes('<')
      ? this.fromAddress
      : `${this.appName} <${this.fromAddress}>`;

    try {
      await this.transporter.sendMail({
        from,
        to: payload.to,
        subject: template.subject,
        text: template.text,
        html: template.html,
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `${ApiResponseMessages.SEND_FORGOT_PASSWORD_EMAIL_FAILED} ${message}`,
      );
      return false;
    }
  }

  onModuleDestroy(): void {
    this.transporter?.close();
  }
}
