import { BASE_URL } from "@/utils/BaseUrl";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const COMPANY_API =`${BASE_URL}/companies`;

export const companyApi = createApi({
  reducerPath: "companyApi",
  baseQuery: fetchBaseQuery({
    baseUrl: COMPANY_API,
    credentials: "include",
  }),
  tagTypes: ["Company"],
  endpoints: (builder) => ({
    createCompany: builder.mutation({
      query: (formData) => ({
        url: "/create",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Company"],
    }),

    getAllCompanies: builder.query({  
      query: ({ page = 1, limit = "", search = "", status = "" }) => ({
        url: "/all",
        method: "GET",
        params: { page, limit, search, status },
      }),
      providesTags: ["Company"],
    }),

    getCompanyById: builder.mutation({
      query: (companyId) => ({
        url: "/view",
        method: "POST",
        body: { companyId },
      }),
      providesTags: ["Company"],
    }),

    updateCompany: builder.mutation({
      query: (formData) => ({
        url: "/update",
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["Company"],
    }),

    deleteCompany: builder.mutation({
      query: (companyId) => ({
        url: "/delete",
        method: "DELETE",
        body: { companyId },
      }),
      invalidatesTags: ["Company"],
    }),
  }),
});

export const {
  useCreateCompanyMutation,
  useGetAllCompaniesQuery,
  useGetCompanyByIdMutation,
  useUpdateCompanyMutation,
  useDeleteCompanyMutation,
} = companyApi;
