export interface Succ<T = any> {
  statusCode: number;
  message: string;
  data: T;
  page?: number;
  limit?: number;
  total?: number;
}
