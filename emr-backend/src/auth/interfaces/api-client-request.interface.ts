import { Request } from 'express';

export interface ApiClientRequest extends Request {
  apiClient?: {
    id: number;
    name: string;
    ip: string;
  };
}
