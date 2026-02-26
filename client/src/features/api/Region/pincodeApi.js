import { BASE_URL } from "@/utils/BaseUrl";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const PINCODE_API =  `${BASE_URL}/region/pincodes`;

export const pincodeApi = createApi({
  reducerPath: "pincodeApi",
  baseQuery: fetchBaseQuery({
    baseUrl: PINCODE_API,
    credentials: "include",
  }),
  tagTypes: ["Pincode"],
  endpoints: (builder) => ({
    createPincode: builder.mutation({
      query: (inputData) => ({
        url: "/create",
        method: "POST",
        body: inputData,
      }),
      invalidatesTags: ["Pincode"],
    }),

    getAllPincodes: builder.query({
      query: ({ page = 1, limit = "", search = "" }) => ({
        url: "/all",
        method: "GET",
        params: { page, limit, search },
      }),
      providesTags: ["Pincode"],
    }),

    getPincodeById: builder.mutation({
      query: (id) => ({
        url: "/view",
        method: "POST",
        body: { id },
      }),
      providesTags: ["Pincode"],
    }),
    getPincodesByLocality: builder.mutation({
      query: (localityId) => ({
        url: "/get-pincode-by-locality",
        method: "POST",
        body: { localityId },
      }),
      providesTags: ["Pincode"],
    }),

    updatePincode: builder.mutation({
      query: (inputData) => ({
        url: "/update",
        method: "PUT",
        body: inputData,
      }),
      invalidatesTags: ["Pincode"],
    }),

    deletePincode: builder.mutation({
      query: (id) => ({
        url: "/delete",
        method: "DELETE",
        body: { id },
      }),
      invalidatesTags: ["Pincode"],
    }),
  }),
});

export const {
  useCreatePincodeMutation,
  useGetAllPincodesQuery,
  useGetPincodeByIdMutation,
  useUpdatePincodeMutation,
  useDeletePincodeMutation,
  useGetPincodesByLocalityMutation,
} = pincodeApi;
