import { createApi } from "@reduxjs/toolkit/query/react";
import { Route as RouteItem } from "@/data/types";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";

export interface RawUserPermission {
  id: number;
  permission: {
    payload: RouteItem[];
  };
}

export interface Service {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  service: {
    id: number;
    name: string;
  };
}

export interface UserService {
  userId: number;
  serviceId: number;
  createdAt: string;
  updatedAt: string;
  createdById: number;
  service: {
    id: number;
    name: string;
  };
}

export interface User {
  id?: number;
  name?: string;
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  role_id: Number;
  facility_id: Number;
  facility?: string;
  role?: string;
  status: string;
  must_change_password?: boolean;
  permissions: RouteItem[];
  userServices?: UserService[];

  cnic?: string;
  dob?: string | Date | null;
  gender?: string;
  blood_type?: string;
  contact?: string;
  emergency_contact?: string;
  address?: string;
  division_id?: number | string;
  district_id?: number | string;
  taluka_id?: number | string;
  uc_id?: number | string;
  division_name?: string;
  district_name?: string;
  taluka_name?: string;
  uc_name?: string;
  qualifications?: string;
  specialization?: string;
  marital_status?: string;
  nationality?: string;
  religion?: string;
}

export interface RawUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  must_change_password?: boolean;
  password: string;
  division_id?: number;
  district_id?: number;
  taluka_id?: number;
  uc_id?: number;
  division?: {
    id: number;
    name: string;
  };
  district?: {
    id: number;
    name: string;
  };
  taluka?: {
    id: number;
    name: string;
  };
  uc?: {
    id: number;
    name: string;
  };
  role: {
    id: Number;
    name: string;
  };
  facility: {
    id: Number;
    name: string;
  };
  userPermissions: RawUserPermission;
  services?: Service[];
  userServices?: UserService[];
  personalInfo?: {
    cnic?: string;
    dob?: string;
    gender?: string;
    blood_type?: string;
    contact?: string;
    emergency_contact?: string;
    address?: string;
    qualifications?: string;
    specialization?: string;
    marital_status?: string;
    nationality?: string;
    religion?: string;
  };
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
  roles?: string[];
  facility_id?: number;
}

export const userApiService = createApi({
  reducerPath: "usersApi",
  baseQuery: baseQueryWithAuthCheck,
  tagTypes: ["Users"],
  endpoints: (builder) => ({
    addUser: builder.mutation<{ success: boolean; message?: string }, User>({
      query: (user) => ({
        url: `admin/users/create`,
        method: "POST",
        body: user,
      }),
      invalidatesTags: ["Users"],
    }),
    editUser: builder.mutation<{ success: boolean; message?: string }, User>({
      query: (user) => ({
        url: `admin/users/${user.id}`,
        method: "PUT",
        body: {
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role_id: user.role_id,
          facility_id: user.facility_id,
          division_id: user.division_id,
          district_id: user.district_id,
          taluka_id: user.taluka_id,
          uc_id: user.uc_id,
          cnic: user.cnic,
          dob: user.dob,
          gender: user.gender,
          blood_type: user.blood_type,
          contact: user.contact,
          emergency_contact: user.emergency_contact,
          address: user.address,
          qualifications: user.qualifications,
          specialization: user.specialization,
          marital_status: user.marital_status,
          nationality: user.nationality,
          religion: user.religion,
        },
      }),
      invalidatesTags: ["Users"],
    }),
    getUsers: builder.query<UserResponse, UserParams>({
      query: (params = {}) => {
        const queryParams: Record<string, any> = {
          page: params.page || 1,
          limit: params.limit || 10,
        };

        if (params.first_name) queryParams.first_name = params.first_name;
        if (params.last_name) queryParams.last_name = params.last_name;
        if (params.email) queryParams.email = params.email;
        if (params.status) queryParams.status = params.status;
        if (params.roles?.length) queryParams.roles = params.roles;
        if (params.facility_id) queryParams.facility_id = params.facility_id;

        return {
          url: "admin/users/get",
          params: queryParams,
        };
      },
      transformResponse: (response: RawUserResponse): UserResponse => {
        return {
          data: response.data.map((user) => {
            return {
              id: user.id,
              name: `${user.first_name} ${user.last_name}`,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              status: user.status,
              must_change_password: user.must_change_password ?? false,
              role: user.role.name,
              role_id: user.role.id,

              facility_id: user.facility?.id,
              facility: user.facility?.name,
              permissions: user?.userPermissions?.permission?.payload || [],
              userServices: user.userServices || [],

              division_id: user.division?.id,
              district_id: user.district?.id,
              taluka_id: user.taluka?.id,
              uc_id: user.uc?.id,

              division_name: user.division?.name,
              district_name: user.district?.name,
              taluka_name: user.taluka?.name,
              uc_name: user.uc?.name,

              cnic: user.personalInfo?.cnic,
              dob: user.personalInfo?.dob,
              gender: user.personalInfo?.gender,
              blood_type: user.personalInfo?.blood_type,
              contact: user.personalInfo?.contact,
              emergency_contact: user.personalInfo?.emergency_contact,
              address: user.personalInfo?.address,
              qualifications: user.personalInfo?.qualifications,
              specialization: user.personalInfo?.specialization,
              marital_status: user.personalInfo?.marital_status,
              nationality: user.personalInfo?.nationality,
              religion: user.personalInfo?.religion,
            };
          }),
          count: response.count,
          page: response.page,
          lastPage: response.lastPage,
        };
      },
      providesTags: ["Users"],
    }),
    deleteUser: builder.mutation<
      { success: boolean; message?: string },
      number
    >({
      query: (id) => ({
        url: `admin/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),
    // Not invalidating "Users": a refetch would swap the table for the
    // full-page loader while the issued temporary password is on screen.
    resetUserPassword: builder.mutation<
      { success: boolean; message?: string },
      { id: number; new_password: string }
    >({
      query: ({ id, new_password }) => ({
        url: `admin/users/${id}/reset-password`,
        method: "POST",
        body: { new_password },
      }),
    }),
  }),
});

export const {
  useGetUsersQuery,
  useDeleteUserMutation,
  useAddUserMutation,
  useEditUserMutation,
  useResetUserPasswordMutation,
} = userApiService;
