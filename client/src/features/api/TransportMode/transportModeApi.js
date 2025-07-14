import { BASE_URL } from "@/utils/BaseUrl";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const TRANSPORT_MODE_API = `${BASE_URL}/transport-modes`;

export const transportModeApi = createApi({
  reducerPath: "transportModeApi",
  baseQuery: fetchBaseQuery({
    baseUrl: TRANSPORT_MODE_API,
    credentials: "include",
  }),
  tagTypes: ["TransportMode"],
  endpoints: (builder) => ({
    createTransportMode: builder.mutation({
      query: (data) => ({
        url: "/create",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["TransportMode"],
    }),
    getAllTransportModes: builder.query({
      query: ({ page = 1, limit = "", search = "", status = "" }) => ({
        url: "/all",
        method: "GET",
        params: { page, limit, search, status },
      }),
      providesTags: ["TransportMode"],
    }),
    getTransportModeById: builder.mutation({
      query: (transportModeId) => ({
        url: "/view",
        method: "POST",
        body: { transportModeId },
      }),
      providesTags: ["TransportMode"],
    }),
    updateTransportMode: builder.mutation({
      query: (data) => ({
        url: "/update",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["TransportMode"],
    }),
    deleteTransportMode: builder.mutation({
      query: (transportModeId) => ({
        url: "/delete",
        method: "DELETE",
        body: { transportModeId },
      }),
      invalidatesTags: ["TransportMode"],
    }),
  }),
});

export const {
  useCreateTransportModeMutation,
  useGetAllTransportModesQuery,
  useGetTransportModeByIdMutation,
  useUpdateTransportModeMutation,
  useDeleteTransportModeMutation,
} = transportModeApi; 