import * as dotenv from 'dotenv';

dotenv.config();

const DEFAULT_PORT = '3000';

const normalizeOrigins = (origins: string[]): string[] =>
  [...new Set(origins.map((origin) => origin.trim()).filter(Boolean))];

const buildAppOrigin = (): string | null => {
  const appUrl = process.env.APP_URL?.trim();
  if (appUrl) {
    return appUrl;
  }

  const appHost = process.env.APP_HOST?.trim();
  if (!appHost) {
    return null;
  }

  const appPort = (process.env.APP_PORT ?? DEFAULT_PORT).trim();
  const protocol = appHost === 'localhost' || appHost.startsWith('127.')
    ? 'http'
    : 'https';

  return `${protocol}://${appHost}${appPort ? `:${appPort}` : ''}`;
};

export const getAllowedOrigins = (): string[] => {
  const configuredOrigins = process.env.ALLOWED_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins?.length) {
    return normalizeOrigins(configuredOrigins);
  }

  return normalizeOrigins([
    process.env.CORS_ORIGIN ?? '',
    buildAppOrigin() ?? '',
  ]);
};
