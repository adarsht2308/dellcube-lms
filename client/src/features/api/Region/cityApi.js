import { BASE_URL } from "@/utils/BaseUrl";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// const CITY_API = "https://dellcube-lms.onrender.com/api/region/cities";
const CITY_API =  `${BASE_URL}/region/cities`;

export const cityApi = createApi({
  reducerPath: "cityApi",
  baseQuery: fetchBaseQuery({
    baseUrl: CITY_API,
    credentials: "include",
  }),
  tagTypes: ["City"],
  endpoints: (builder) => ({
    createCity: builder.mutation({
      query: (inputData) => ({
        url: "/create",
        method: "POST",
        body: inputData,
      }),
      invalidatesTags: ["City"],
    }),

    getAllCities: builder.query({
      query: ({ page = 1, limit = "", search = "" }) => ({
        url: "/all",
        method: "GET",
        params: { page, limit, search },
      }),
      providesTags: ["City"],
    }),

    getCityById: builder.mutation({
      query: (cityId) => ({
        url: "/view",
        method: "POST",
        body: { cityId },
      }),
      providesTags: ["City"],
    }),

    updateCity: builder.mutation({
      query: (inputData) => ({
        url: "/update",
        method: "PUT",
        body: inputData,
      }),
      invalidatesTags: ["City"],
    }),

    deleteCity: builder.mutation({
      query: (id) => ({
        url: "/delete",
        method: "DELETE",
        body: { id },
      }),
      invalidatesTags: ["City"],
    }),
    getCitiesByState: builder.mutation({
      query: (stateId) => ({
        url: "/get-city-by-state",
        method: "POST",
        body: { stateId },
      }),
      providesTags: ["City"],
    }),
  }),
});

export const {
  useCreateCityMutation,
  useGetAllCitiesQuery,
  useGetCityByIdMutation,
  useUpdateCityMutation,
  useDeleteCityMutation,
  useGetCitiesByStateMutation,
} = cityApi;
