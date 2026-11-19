export interface ReferralResponse {
  message: string;
  patient: {
    id?: number;
    firstName?: string;
    lastName?: string;
  };
  service: {
    id: number,
    name: string;
  };
  doctor?: {
    id?: number;
    firstName?: string;
    lastName?: string;
  };
}
