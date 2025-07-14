import { BASE_URL } from "@/utils/BaseUrl";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// const BRANCH_API =  "https://dellcube-lms.onrender.com/api/branches";
const BRANCH_API = `${BASE_URL}/branches`;

export const branchApi = createApi({
  reducerPath: "branchApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BRANCH_API,
    credentials: "include",
  }),
  tagTypes: ["Branch"],
  endpoints: (builder) => ({
    // Create a new branch
    createBranch: builder.mutation({
      query: (data) => ({
        url: "/create",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Branch"],
    }),

    // Fetch all branches with pagination, search, status and company filters
    getAllBranches: builder.query({
      query: ({ page = 1, limit = "", search = "", status = "", company = "" }) => ({
        url: "/all",
        method: "GET",
        params: { page, limit, search, status, company },
      }),
      providesTags: ["Branch"],
    }),

    // Get branch by ID
    getBranchById: builder.mutation({
      query: (id) => ({
        url: "/view",
        method: "POST",
        body: { id },
      }),
      providesTags: ["Branch"],
    }),

    // Update branch
    updateBranch: builder.mutation({
      query: (data) => ({
        url: "/update",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Branch"],
    }),

    // Delete branch
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
