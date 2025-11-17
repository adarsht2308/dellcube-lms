import { BASE_URL } from "@/utils/BaseUrl";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const TRACKING_API = `${BASE_URL}/tracking`;

export const trackingApi = createApi({
  reducerPath: "trackingApi",
  baseQuery: fetchBaseQuery({
    baseUrl: TRACKING_API,
    credentials: "include",
  }),
  tagTypes: ["Tracking"],
  endpoints: (builder) => ({
    // Track invoice by docket number (public endpoint)
    trackByDocketNumber: builder.query({
      query: (docketNumber) => ({
        url: `/docket/${docketNumber}`,
        method: "GET",
      }),
      providesTags: ["Tracking"],
    }),

    // Track invoice by ID (authenticated)
    trackById: builder.query({
      query: (invoiceId) => ({
        url: `/invoice/${invoiceId}`,
        method: "GET",
      }),
      providesTags: ["Tracking"],
    }),
  }),
});

export const {
  useTrackByDocketNumberQuery,
  useTrackByIdQuery,
  useLazyTrackByDocketNumberQuery,
  useLazyTrackByIdQuery,
} = trackingApi;

