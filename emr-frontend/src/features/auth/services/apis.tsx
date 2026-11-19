const PATH = import.meta.env.VITE_API_BASE_URL;
const BASE_PATH = `${PATH}auth`;

export const LOGIN_API = `${BASE_PATH}/login`;
export const SIGNUP_API = `${BASE_PATH}/register`;
export const LOGOUT_API = `${BASE_PATH}/logout`;
export const VALIDATE_TOKEN = `${BASE_PATH}/validate-token`;
export const USER_PERMISSIONS_BY_ID = `${BASE_PATH}/permission`;
export const FORGOT_PASSWORD_API = `${BASE_PATH}/forgot-password`;
export const RESET_PASSWORD_API = `${BASE_PATH}/users/reset-password`;
export const GET_USER_API = `${BASE_PATH}/user`;
export const SUPER_ADMIN_LOGIN_API = `${BASE_PATH}/super-admin/login`;
export const GET_ALL_ROUTES_API = `${BASE_PATH}/routes`;
export const SEND_EMAIL_API = `${BASE_PATH}/forgot-password`;
export const RESET_PASSWORD_WITH_TOKEN_API = `${BASE_PATH}/reset-password`;
export const IMPERSONATION_LINK_API = `${BASE_PATH}/impersonation-links`;
export const IMPERSONATION_EXCHANGE_API = `${BASE_PATH}/impersonation/exchange`;
