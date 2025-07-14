import { BASE_URL } from "@/utils/BaseUrl";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// const COUNTRY_API = "https://dellcube-lms.onrender.com/api/region/country";
const COUNTRY_API =  `${BASE_URL}/region/country`;

export const countryApi = createApi({
  reducerPath: "countryApi",
  baseQuery: fetchBaseQuery({
    baseUrl: COUNTRY_API,
    credentials: "include",
  }),
  tagTypes: ["Country"],
  endpoints: (builder) => ({
    createCountry: builder.mutation({
      query: (inputData) => ({
        url: "/create",
        method: "POST",
        body: inputData,
      }),
      invalidatesTags: ["Country"],
    }),

    getAllCountries: builder.query({
      query: ({ page = 1, limit = "", search = "" }) => ({
        url:  '/all',
        method: "GET",
        params: { page, limit, search },
      }),
      providesTags: ["Country"],
    }),

    getCountryById: builder.mutation({
      query: (id) => ({
        url: "/view",
        method: "POST",
        body: { id },
      }),
      providesTags: ["Country"],
    }),

    updateCountry: builder.mutation({
      query: (inputData) => ({
        url: "/update",
        method: "PUT",
        body: inputData,
      }),
      invalidatesTags: ["Country"],
    }),

    deleteCountry: builder.mutation({
      query: (id) => ({
        url: "/delete",
        method: "DELETE",
        body: { id },
      }),
      invalidatesTags: ["Country"],
    }),
  }),
});

export const {
  useCreateCountryMutation,
  useGetAllCountriesQuery,
  useGetCountryByIdMutation,
  useUpdateCountryMutation,
  useDeleteCountryMutation,
} = countryApi;
