export const PASSWORD_MIN_LENGTH = 8;
// bcrypt only uses the first 72 bytes, so keep the limit well below that.
export const PASSWORD_MAX_LENGTH = 64;
export const PASSWORD_STRENGTH_REGEX = /^(?=.*[A-Za-z])(?=.*\d).+$/;
export const PASSWORD_STRENGTH_MESSAGE =
  'Password must contain at least one letter and one number';
