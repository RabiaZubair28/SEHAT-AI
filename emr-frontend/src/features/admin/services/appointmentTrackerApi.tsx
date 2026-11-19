import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";

export const adminAppointmentApiService = createApi({
  reducerPath: "adminAppointmentApiService",
  baseQuery: baseQueryWithAuthCheck,
  endpoints: (builder) => ({
    getAllPatients: builder.query<
      any,
      {
        page?: number;
        limit?: number;
        facility_id?: number;
        LevelOfCare?: string;
        cnic?: string;
        first_name?: string;
        last_name?: string;
        phone_number?: string;
        mr_no?: string;
      }
    >({
      query: ({
        page = 1,
        limit = 10,
        facility_id,
        LevelOfCare,
        cnic,
        first_name,
        last_name,
        phone_number,
        mr_no,
      }) => {
        // Build query parameters
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        if (facility_id) params.append("facility_id", facility_id.toString());
        if (LevelOfCare) params.append("LevelOfCare", LevelOfCare);
        if (cnic) params.append("cnic", cnic);
        if (first_name) params.append("first_name", first_name);
        if (last_name) params.append("last_name", last_name);
        if (phone_number) params.append("phone_number", phone_number);
        if (mr_no) params.append("mr_no", mr_no);

        return {
          url: `/appointments/appointment-services?${params.toString()}`,
          method: "GET",
        };
      },
    }),
  }),
});

export const { useGetAllPatientsQuery } = adminAppointmentApiService;
