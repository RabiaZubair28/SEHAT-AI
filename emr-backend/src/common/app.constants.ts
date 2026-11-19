export const ACCESS_TOKEN_COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 7; // 7 days

export const AppEnvironments = {
  PRODUCTION: 'production',
  DEVELOPMENT: 'development',
  TEST: 'test',
  LOCAL: 'local',
};

export const isAppEnvironmentLocal =
  process.env.NODE_ENV === AppEnvironments.LOCAL;

export const ADMIN_ACCESS_TOKEN = 'admin_access_token';
export const ACCESS_TOKEN = 'access_token';
export const CLIENT_KEY_HEADER = 'x-client-key';

export const TIME_DIFF = 12;
export const TIME_DIFF_IN_HOURS = 1000 * 60 * 60;

export const NEWBORN_ASSESMENT_LIMIT = 3;

export const MEDICINE_THRESHOLD = 5;

export const AUTO_CHECKOUT_HOURS = 12;

export const AKUH_GUIDELINES_BASE_URL = 'https://guidelines.aku.edu/govt';

export const DISTRICT_CACHE_TTL_SECONDS = 60 * 60 * 12;

export const DIVISION_CACHE_TTL_SECONDS = 60 * 60 * 12;

export const FACILITIES_CACHE_TTL_SECONDS = 60 * 60 * 12;

export const TALUKA_CACHE_TTL_SECONDS = 60 * 60 * 12;

export const UC_CACHE_TTL_SECONDS = 60 * 60 * 12;

export const SERVICE_CACHE_TTL_SECONDS = 60 * 60 * 12;

export const SYNC_API_LIMIT = 100;

export const AUTH_GUARD_USER_CACHE_TTL_SECONDS = 60 * 5;

export const PASSWORD_SALT_ROUNDS = 12;