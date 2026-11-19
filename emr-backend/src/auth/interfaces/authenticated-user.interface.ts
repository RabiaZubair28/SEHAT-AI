export interface AuthenticatedUser {
  sub: number;
  role: string;
  permissions?: Record<string, any>[];
  facilityId: number | null;
  facilityUcId: number | null;
  districtId: number | null;
}
