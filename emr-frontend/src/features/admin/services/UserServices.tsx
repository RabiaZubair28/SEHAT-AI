import { createApi } from "@reduxjs/toolkit/query/react";
import { Route as RouteItem } from "@/data/types";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";

export interface RawUserPermission {
  id: number;
  permission: {
    payload: RouteItem[];
  };
}

export interface User {
  id?: number;
  name?: string;
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  role_id: number;
  facility_id: number;
  facility?: string;
  role?: string;
  status: string;
  userServices: [];
}

export interface RawUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  password: string;
  role: {
    id: number;
    name: string;
  };
  facility: {
    id: number;
    name: string;
  };
  services: [];
}

export interface RawUserResponse {
  data: RawUser[];
  count: number;
  page: number;
  lastPage: number;
}

export interface UserResponse {
  data: User[];
  count: number;
  page: number;
  lastPage: number;
}

export interface UserParams {
  page?: number;
  limit?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  status?: string;
  facility_id?: number;
}

interface AssignService {
  user_id?: number;
  services_ids: number[];
}

export interface ServiceByRole {
  id: number;
  name: string;
}

export const userServicesApi = createApi({
  reducerPath: "userServicesApi",
  baseQuery: baseQueryWithAuthCheck,
  endpoints: (builder) => ({
    // Get allowed services for a role
    getServicesByRole: builder.query<ServiceByRole[], string>({
      query: (role_name) => ({
        url: "user-services/services-by-role",
        params: { role_name },
      }),
      transformResponse: (response: { data: ServiceByRole[] }) =>
        response.data,
    }),

    // Create a user
    addUserServices: builder.mutation<
      { success: boolean; message?: string; error?: string },
      AssignService
    >({
      query: (user) => ({
        url: `user-services`,
        method: "POST",
        body: user,
      }),
    }),

    // Get all users (paginated + filters)
    getUserServices: builder.query<UserResponse, UserParams>({
      query: (params = {}) => {
        const queryParams: Record<string, string | number> = {
          page: params.page || 1,
          limit: params.limit || 10,
        };

        if (params.first_name) queryParams.first_name = params.first_name;
        if (params.last_name) queryParams.last_name = params.last_name;
        if (params.email) queryParams.email = params.email;
        if (params.status) queryParams.status = params.status;
        if (params.facility_id) queryParams.facility_id = params.facility_id;

        return {
          url: "user-services",
          params: queryParams,
        };
      },
      transformResponse: (response: RawUserResponse): UserResponse => ({
        data: response.data.map((user) => ({
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          first_name: user?.first_name,
          last_name: user?.last_name,
          email: user?.email,
          status: user?.status,
          role: user.role?.name,
          role_id: user.role?.id,
          facility_id: user.facility?.id,
          facility: user.facility?.name,
          services: user?.services,
          userServices: user?.services,
        })),
        count: response.count,
        page: response.page,
        lastPage: response.lastPage,
      }),
    }),
  }),
});

// Export hooks
export const {
  useGetUserServicesQuery,
  useAddUserServicesMutation,
  useGetServicesByRoleQuery,
} = userServicesApi;
