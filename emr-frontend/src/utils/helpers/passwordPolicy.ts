// Mirrors emr-backend/src/auth/password-policy.ts
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;
export const PASSWORD_STRENGTH_REGEX = /^(?=.*[A-Za-z])(?=.*\d).+$/;
export const PASSWORD_STRENGTH_MESSAGE =
  "Password must contain at least one letter and one number";

// Returned in the 403 body when an admin-reset password has not been changed yet.
export const PASSWORD_CHANGE_REQUIRED_CODE = "PASSWORD_CHANGE_REQUIRED";

export const passwordPolicyRules = [
  {
    min: PASSWORD_MIN_LENGTH,
    message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
  },
  {
    max: PASSWORD_MAX_LENGTH,
    message: `Password cannot exceed ${PASSWORD_MAX_LENGTH} characters`,
  },
  { pattern: PASSWORD_STRENGTH_REGEX, message: PASSWORD_STRENGTH_MESSAGE },
];

// Look-alike characters (0/O, 1/l/I) are left out so the password is easy to
// read out over the phone.
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
const DIGITS = "23456789";

const randomIndex = (max: number): number => {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] % max;
};

export const generateTemporaryPassword = (length = 10): string => {
  const alphabet = LETTERS + DIGITS;
  const chars = [
    LETTERS[randomIndex(LETTERS.length)],
    DIGITS[randomIndex(DIGITS.length)],
  ];

  while (chars.length < length) {
    chars.push(alphabet[randomIndex(alphabet.length)]);
  }

  // Shuffle so the guaranteed letter and digit are not always first.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
};

// NestJS validation errors return `message` as a string array.
export const getApiErrorMessage = (error: unknown): string | undefined => {
  const message = (error as { data?: { message?: string | string[] } })?.data
    ?.message;
  return Array.isArray(message) ? message.join(", ") : message;
};
