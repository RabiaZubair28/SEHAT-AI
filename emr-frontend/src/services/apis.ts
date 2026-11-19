const BASE_PATH = import.meta.env.VITE_API_BASE_URL;

export const GET_ROLES_API = `${BASE_PATH}roles`;
export const GET_ALL_DIVISIONS = `${BASE_PATH}division`;
export const GET_DISTRICT_BY_DIVISION_API = `${BASE_PATH}districts/division`;
export const GET_TALUKA_BY_DISTRICT_API = `${BASE_PATH}taluka/district`;
export const GET_ALL_UCS = `${BASE_PATH}uc`;
export const GET_ALL_DISTRICTS = `${BASE_PATH}districts`;
export const GET_DOCTORS_BY_FACILITY_API = `${BASE_PATH}doctors/facility`;
