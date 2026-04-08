import { BASE_URL } from "@/utils/BaseUrl";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getTokenData } from "@/utils/getTokenData";

const CUSTOMER_API = `${BASE_URL}/customers`;

export const customerApi = createApi({
  reducerPath: "customerApi",
  baseQuery: fetchBaseQuery({
    baseUrl: CUSTOMER_API,
    credentials: "include",
  }),
  tagTypes: ["Customer"],
  endpoints: (builder) => ({
    createCustomer: builder.mutation({
      query: (payload) => ({
        url: "/create",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Customer"],
    }),

    getAllCustomers: builder.query({
      query: ({
        page = 1,
        limit = 10,
        search = "",
        status = "",
        companyId = "",
        branchId = "",
      }) => {
        // Get companyId and branchId from token if not provided
        const { companyId: tokenCompanyId, branchId: tokenBranchId } = getTokenData();
        const finalCompanyId = companyId || tokenCompanyId || "";
        const finalBranchId = branchId || tokenBranchId || "";
        
        return {
          url: "/all",
          method: "GET",
          params: { page, limit, search, status, companyId: finalCompanyId, branchId: finalBranchId },
        };
      },
      providesTags: ["Customer"],
    }),

    getCustomerById: builder.mutation({
      query: (customerId) => ({
        url: "/view",
        method: "POST",
        body: { id: customerId },
      }),
      providesTags: ["Customer"],
    }),

    updateCustomer: builder.mutation({
      query: ({ customerId, ...rest }) => ({
        url: "/update",
        method: "PUT",
        body: { customerId, ...rest },
      }),
      invalidatesTags: ["Customer"],
    }),

    deleteCustomer: builder.mutation({
      query: (customerId) => ({
        url: "/delete",
        method: "DELETE",
        body: { id: customerId },
      }),
      invalidatesTags: ["Customer"],
    }),

    bulkUploadConsignees: builder.mutation({
      query: ({ customerId, consignees }) => ({
        url: "/consignees/bulk-upload",
        method: "POST",
        body: { customerId, consignees },
      }),
      invalidatesTags: ["Customer"],
    }),

    bulkUploadConsignors: builder.mutation({
      query: ({ customerId, consignors }) => ({
        url: "/consignors/bulk-upload",
        method: "POST",
        body: { customerId, consignors },
      }),
      invalidatesTags: ["Customer"],
    }),

    exportConsignees: builder.query({
      query: (customerId) => ({
        url: `/consignees/export/${customerId}`,
        method: "GET",
      }),
    }),

    exportConsignors: builder.query({
      query: (customerId) => ({
        url: `/consignors/export/${customerId}`,
        method: "GET",
      }),
    }),

    manageMisFields: builder.mutation({
      query: (payload) => ({
        url: "/mis-fields/manage",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Customer"],
    }),
    manageBillingFields: builder.mutation({
      query: (payload) => ({
        url: "/billing-fields/manage",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Customer"],
    }),
  }),
});

export const {
  useCreateCustomerMutation,
  useGetAllCustomersQuery,
  useGetCustomerByIdMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useBulkUploadConsigneesMutation,
  useBulkUploadConsignorsMutation,
  useLazyExportConsigneesQuery,
  useLazyExportConsignorsQuery,
  useManageMisFieldsMutation,
  useManageBillingFieldsMutation,
} = customerApi;
