import { BASE_URL } from "@/utils/BaseUrl";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BRANCH_API = `${BASE_URL}/branches`;

export const branchApi = createApi({
  reducerPath: "branchApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BRANCH_API,
    credentials: "include",
  }),
  tagTypes: ["Branch"],
  endpoints: (builder) => ({
    createBranch: builder.mutation({
      query: (data) => ({
        url: "/create",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Branch"],
    }),

    getAllBranches: builder.query({
      query: ({ page = 1, limit = "", search = "", status = "", company = "" }) => ({
        url: "/all",
        method: "GET",
        params: { page, limit, search, status, company },
      }),
      providesTags: ["Branch"],
    }),

    getBranchById: builder.mutation({
      query: (id) => ({
        url: "/view",
        method: "POST",
        body: { id },
      }),
      providesTags: ["Branch"],
    }),

    updateBranch: builder.mutation({
      query: (data) => ({
        url: "/update",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Branch"],
    }),

    deleteBranch: builder.mutation({
      query: (id) => ({
        url: "/delete",
        method: "DELETE",
        body: { id },
      }),
      invalidatesTags: ["Branch"],
    }),
    getBranchesByCompany: builder.mutation({
      query: (companyId) => ({
        url: "branches-by-company",  
        method: "POST",
        body: {companyId },
      }),
    }),

  }),
});

export const {
  useCreateBranchMutation,
  useGetAllBranchesQuery,
  useGetBranchByIdMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
  useGetBranchesByCompanyMutation,
} = branchApi;
