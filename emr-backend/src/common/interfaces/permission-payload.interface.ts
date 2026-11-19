export type PermissionHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface PermissionPayloadItem {
  route: string;
  name: string;
  method: PermissionHttpMethod;
  description: string;
  module: string;
  guards: string[];
  hidden?: string[];
}

export interface PermissionPayloadItemSlim {
  route: string;
  method: PermissionHttpMethod;
}
