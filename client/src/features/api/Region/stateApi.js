import { BASE_URL } from "@/utils/BaseUrl";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// const STATE_API = "https://dellcube-lms.onrender.com/api/region/states";
const STATE_API = `${BASE_URL}/region/states`;

export const stateApi = createApi({
  reducerPath: "stateApi",
  baseQuery: fetchBaseQuery({
    baseUrl: STATE_API,
    credentials: "include",
  }),
  tagTypes: ["State"],
  endpoints: (builder) => ({
    createState: builder.mutation({
      query: (inputData) => ({
        url: "/create",
        method: "POST",
        body: inputData,
      }),
      invalidatesTags: ["State"],
    }),

    getAllStates: builder.query({
      query: ({ page = 1, limit = "", search = "" }) => ({
        url: "/all",
        method: "GET",
        params: { page, limit, search },
      }),
      providesTags: ["State"],
    }),

    getStateById: builder.mutation({
      query: (stateId) => ({
        url: "/view",
        method: "POST",
        body: { stateId },
      }),
      providesTags: ["State"],
    }),
    getStatesByCountry: builder.mutation({
      query: (countryId) => ({
        url: "/get-states-by-country",
        method: "POST",
        body: { countryId },
      }),
      providesTags: ["State"],
    }),
    updateState: builder.mutation({
      query: (inputData) => ({
        url: "/update",
        method: "PUT",
        body: inputData,
      }),
      invalidatesTags: ["State"],
    }),

    deleteState: builder.mutation({
      query: (id) => ({
        url: "/delete",
        method: "DELETE",
        body: { id },
      }),
      invalidatesTags: ["State"],
    }),
  }),
});

export const {
  useCreateStateMutation,
  useGetAllStatesQuery,
  useGetStatesByCountryMutation,
  useGetStateByIdMutation,
  useUpdateStateMutation,
  useDeleteStateMutation,
} = stateApi;
