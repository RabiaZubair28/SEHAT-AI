import { TelehealthAvailabilityStatus } from '../enums/telehealth.enums';

export interface TelehealthQueueDoctor {
  doctor_id: number;
  first_name: string;
  last_name: string;
  email: string;
  specialty: string | null;
  availability: TelehealthAvailabilityStatus;
  current_call_status: 'busy' | 'idle';
  is_checked_in: boolean;
  is_telehealth_consultant: boolean;
  services: string[];
}
