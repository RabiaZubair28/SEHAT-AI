import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";
import { NUTRITION_ADVISOR_API } from "./apis";
import type {
  Delivery,
  FoodLibrary,
  Overview,
  PlanContent,
  PlanResponse,
  Preferences,
  Handout,
  ReviewQueueItem,
} from "@health-advisor/types";

export const nutritionAdvisorApi = createApi({
  reducerPath: "nutritionAdvisorApi",
  baseQuery: baseQueryWithAuthCheck,
  tagTypes: ["advisorOverview", "advisorPlan", "advisorDeliveries", "advisorReviews"],

  endpoints: (builder) => ({
    getAdvisorFoods: builder.query<FoodLibrary, void>({
      query: () => `${NUTRITION_ADVISOR_API}/foods`,
    }),

    getAdvisorReviewQueue: builder.query<ReviewQueueItem[], void>({
      query: () => `${NUTRITION_ADVISOR_API}/reviews`,
      providesTags: ["advisorReviews"],
    }),

    // With nutritionInput, the summary uses the Nutrition form's current
    // (possibly unsaved) vitals instead of only what was saved earlier.
    getAdvisorOverview: builder.query<Overview, { appointmentServiceId: number; nutritionInput?: unknown }>({
      query: ({ appointmentServiceId, nutritionInput }) =>
        nutritionInput
          ? { url: `${NUTRITION_ADVISOR_API}/${appointmentServiceId}/overview`, method: "POST", body: { nutritionInput } }
          : `${NUTRITION_ADVISOR_API}/${appointmentServiceId}/overview`,
      providesTags: (_r, _e, { appointmentServiceId }) => [{ type: "advisorOverview", id: appointmentServiceId }],
    }),

    previewAdvisorOverview: builder.mutation<Overview, { appointmentServiceId: number; preferences: Preferences }>({
      query: ({ appointmentServiceId, preferences }) => ({
        url: `${NUTRITION_ADVISOR_API}/${appointmentServiceId}/overview`,
        method: "POST",
        body: { preferences },
      }),
    }),

    getCurrentAdvisorPlan: builder.query<PlanResponse, number>({
      query: (appointmentServiceId) =>
        `${NUTRITION_ADVISOR_API}/${appointmentServiceId}/plans/current`,
      providesTags: (_r, _e, id) => [{ type: "advisorPlan", id }],
    }),

    generateAdvisorPlan: builder.mutation<
      PlanResponse,
      { appointmentServiceId: number; preferences: Preferences; nutritionInput?: unknown }
    >({
      query: ({ appointmentServiceId, preferences, nutritionInput }) => ({
        url: `${NUTRITION_ADVISOR_API}/${appointmentServiceId}/plans`,
        method: "POST",
        body: { preferences, nutritionInput },
      }),
      invalidatesTags: (_r, _e, { appointmentServiceId }) => [
        { type: "advisorOverview", id: appointmentServiceId },
        { type: "advisorPlan", id: appointmentServiceId },
      ],
    }),

    updateAdvisorPlan: builder.mutation<
      PlanResponse,
      {
        planId: number;
        appointmentServiceId: number;
        plan?: PlanContent;
        handout?: Partial<Handout>;
        preferences?: Preferences;
      }
    >({
      query: ({ planId, plan, handout, preferences }) => ({
        url: `${NUTRITION_ADVISOR_API}/plans/${planId}`,
        method: "PATCH",
        body: { plan, handout, preferences },
      }),
      // The editor keeps its own copy; refresh the overview badge only.
      invalidatesTags: (_r, _e, { appointmentServiceId }) => [
        { type: "advisorOverview", id: appointmentServiceId },
      ],
    }),

    submitAdvisorPlan: builder.mutation<PlanResponse, { planId: number; appointmentServiceId: number }>({
      query: ({ planId }) => ({
        url: `${NUTRITION_ADVISOR_API}/plans/${planId}/submit`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, { appointmentServiceId }) => [
        { type: "advisorOverview", id: appointmentServiceId },
        { type: "advisorPlan", id: appointmentServiceId },
        "advisorReviews",
      ],
    }),

    reviewAdvisorPlan: builder.mutation<
      PlanResponse,
      {
        planId: number;
        appointmentServiceId: number;
        decision: "approve" | "reject" | "request_changes";
        contentHash: string;
        comment?: string;
      }
    >({
      query: ({ planId, decision, contentHash, comment }) => ({
        url: `${NUTRITION_ADVISOR_API}/plans/${planId}/review`,
        method: "POST",
        body: { decision, contentHash, comment },
      }),
      invalidatesTags: (_r, _e, { appointmentServiceId }) => [
        { type: "advisorOverview", id: appointmentServiceId },
        { type: "advisorPlan", id: appointmentServiceId },
        "advisorReviews",
      ],
    }),

    getAdvisorDeliveries: builder.query<Delivery[], number>({
      query: (planId) => `${NUTRITION_ADVISOR_API}/plans/${planId}/deliveries`,
      providesTags: (_r, _e, id) => [{ type: "advisorDeliveries", id }],
    }),

    createAdvisorDelivery: builder.mutation<Delivery, { planId: number; form: FormData }>({
      query: ({ planId, form }) => ({
        url: `${NUTRITION_ADVISOR_API}/plans/${planId}/deliveries`,
        method: "POST",
        body: form,
      }),
      invalidatesTags: (_r, _e, { planId }) => [{ type: "advisorDeliveries", id: planId }],
    }),
  }),
});

export const {
  useGetAdvisorFoodsQuery,
  useGetAdvisorReviewQueueQuery,
  useGetAdvisorOverviewQuery,
  usePreviewAdvisorOverviewMutation,
  useGetCurrentAdvisorPlanQuery,
  useGenerateAdvisorPlanMutation,
  useUpdateAdvisorPlanMutation,
  useSubmitAdvisorPlanMutation,
  useReviewAdvisorPlanMutation,
  useGetAdvisorDeliveriesQuery,
  useCreateAdvisorDeliveryMutation,
} = nutritionAdvisorApi;
