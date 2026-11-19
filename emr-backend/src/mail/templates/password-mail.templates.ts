export interface MailTemplate {
  subject: string;
  text: string;
  html: string;
}

interface TemplateBaseInput {
  appName: string;
  firstName?: string;
  lastName?: string;
}

interface ResetPasswordTemplateInput extends TemplateBaseInput {
  newPassword: string;
}

interface ForgotPasswordTemplateInput extends TemplateBaseInput {
  resetLink: string;
  expiresIn?: string;
}

function buildRecipientGreeting(firstName?: string, lastName?: string): string {
  const recipientName = [firstName, lastName].filter(Boolean).join(' ');
  return recipientName ? `Hello ${recipientName},` : 'Hello,';
}

export function buildResetPasswordTemplate(
  input: ResetPasswordTemplateInput,
): MailTemplate {
  const greeting = buildRecipientGreeting(input.firstName, input.lastName);
  const subject = `${input.appName} password reset`;
  const text = [
    greeting,
    '',
    'Your password has been reset by an administrator.',
    '',
    `New password: ${input.newPassword}`,
    '',
    'Please log in and change it as soon as possible.',
    '',
    `- ${input.appName} Team`,
  ].join('\n');

  const html = `
<p>${greeting}</p>
<p>Your password has been reset by an administrator.</p>
<p><strong>New password:</strong> ${input.newPassword}</p>
<p>Please log in and change it as soon as possible.</p>
<p>- ${input.appName} Team</p>
`.trim();

  return { subject, text, html };
}

export function buildForgotPasswordTemplate(
  input: ForgotPasswordTemplateInput,
): MailTemplate {
  const greeting = buildRecipientGreeting(input.firstName, input.lastName);
  const subject = `${input.appName} password reset link`;
  const validityLine = input.expiresIn
    ? `This link expires in ${input.expiresIn}.`
    : 'This link has limited validity.';

  const text = [
    greeting,
    '',
    'We received a request to reset your password.',
    validityLine,
    '',
    `Reset password: ${input.resetLink}`,
    '',
    'If you did not request this, you can ignore this email.',
    '',
    `- ${input.appName} Team`,
  ].join('\n');

  const html = `
<p>${greeting}</p>
<p>We received a request to reset your password.</p>
<p>${validityLine}</p>
<p><a href="${input.resetLink}">Reset Password</a></p>
<p>If you did not request this, you can ignore this email.</p>
<p>- ${input.appName} Team</p>
`.trim();

  return { subject, text, html };
}
