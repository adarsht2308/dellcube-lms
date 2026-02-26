import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "@/utils/BaseUrl";

// BASE_URL already includes `/api`, so this becomes `/api/activities`
const ACTIVITY_API = `${BASE_URL}/activities`;

export const activityApi = createApi({
  reducerPath: "activityApi",
  baseQuery: fetchBaseQuery({
    baseUrl: ACTIVITY_API,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Activity"],
  endpoints: (builder) => ({
    // Get all activities with filters and pagination
    getAllActivities: builder.query({
      query: (params) => {
        // Build query string from params
        const queryParams = new URLSearchParams();
        
        if (params?.page) queryParams.append("page", params.page);
        if (params?.limit) queryParams.append("limit", params.limit);
        if (params?.company) queryParams.append("company", params.company);
        if (params?.branch) queryParams.append("branch", params.branch);
        if (params?.user) queryParams.append("user", params.user);
        if (params?.action) queryParams.append("action", params.action);
        if (params?.entity) queryParams.append("entity", params.entity);
        if (params?.startDate) queryParams.append("startDate", params.startDate);
        if (params?.endDate) queryParams.append("endDate", params.endDate);
        if (params?.search) queryParams.append("search", params.search);
        if (params?.success !== undefined) queryParams.append("success", params.success);
        if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
        if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);
        
        return {
          url: `/?${queryParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Activity"],
    }),

    // Get activity statistics
    getActivityStats: builder.query({
      query: (params) => {
        const queryParams = new URLSearchParams();
        
        if (params?.company) queryParams.append("company", params.company);
        if (params?.branch) queryParams.append("branch", params.branch);
        if (params?.startDate) queryParams.append("startDate", params.startDate);
        if (params?.endDate) queryParams.append("endDate", params.endDate);
        
        return {
          url: `/stats?${queryParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Activity"],
    }),

    // Get single activity by ID
    getActivityById: builder.query({
      query: (id) => ({
        url: `/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Activity", id }],
    }),

    // Cleanup old activities (SuperAdmin only)
    cleanupOldActivities: builder.mutation({
      query: (days) => ({
        url: `/cleanup${days ? `?days=${days}` : ""}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Activity"],
    }),
  }),
});

export const {
  useGetAllActivitiesQuery,
  useGetActivityStatsQuery,
  useGetActivityByIdQuery,
  useCleanupOldActivitiesMutation,
} = activityApi;
