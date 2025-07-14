import { BASE_URL } from "@/utils/BaseUrl";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// const LOCALITY_API = "https://dellcube-lms.onrender.com/api/region/localities";
const LOCALITY_API =  `${BASE_URL}/region/localities`;

export const localityApi = createApi({
  reducerPath: "localityApi",
  baseQuery: fetchBaseQuery({
    baseUrl: LOCALITY_API,
    credentials: "include",
  }),
  tagTypes: ["Locality"],
  endpoints: (builder) => ({
    createLocality: builder.mutation({
      query: (inputData) => ({
        url: "/create",
        method: "POST",
        body: inputData,
      }),
      invalidatesTags: ["Locality"],
    }),

    // Get all localities (paginated + search)
    getAllLocalities: builder.query({
      query: ({ page = 1, limit = "", search = "" }) => ({
        url: "/all",
        method: "GET",
        params: { page, limit, search },
      }),
      providesTags: ["Locality"],
    }),

    // Get locality by ID
    getLocalityById: builder.mutation({
      query: (localityId) => ({
        url: "/view",
        method: "POST",
        body: { localityId },
      }),
      providesTags: ["Locality"],
    }),

    // Update locality
    updateLocality: builder.mutation({
      query: (inputData) => ({
        url: "/update",
        method: "PUT",
        body: inputData,
      }),
      invalidatesTags: ["Locality"],
    }),

    // Delete locality
    deleteLocality: builder.mutation({
      query: (id) => ({
        url: "/delete",
        method: "DELETE",
        body: { id },
      }),
      invalidatesTags: ["Locality"],
    }),
    getLocalitiesByCity: builder.mutation({
      query: (cityId) => ({
        url: "/get-locality-by-city",
        method: "POST",
        body: { cityId },
      }),
      providesTags: ["Locality"],
    }),
  }),
});

export const {
  useCreateLocalityMutation,
  useGetAllLocalitiesQuery,
  useGetLocalityByIdMutation,
  useUpdateLocalityMutation,
  useDeleteLocalityMutation,
  useGetLocalitiesByCityMutation,
} = localityApi;
