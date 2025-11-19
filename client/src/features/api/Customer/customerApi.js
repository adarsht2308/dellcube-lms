import { BASE_URL } from "@/utils/BaseUrl";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const CUSTOMER_API = `${BASE_URL}/customers`;

export const customerApi = createApi({
  reducerPath: "customerApi",
  baseQuery: fetchBaseQuery({
    baseUrl: CUSTOMER_API,
    credentials: "include",
  }),
  tagTypes: ["Customer"],
  endpoints: (builder) => ({
    // Create a new customer
    createCustomer: builder.mutation({
      query: (payload) => ({
        url: "/create",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Customer"],
    }),

    // Get all customers with pagination, search, filters
    getAllCustomers: builder.query({
      query: ({
        page = 1,
        limit = 10,
        search = "",
        status = "",
        companyId = "",
        branchId = "",
      }) => ({
        url: "/all",
        method: "GET",
        params: { page, limit, search, status, companyId, branchId },
      }),
      providesTags: ["Customer"],
    }),

    // Get customer by ID
    getCustomerById: builder.mutation({
      query: (customerId) => ({
        url: "/view",
        method: "POST",
        body: { id: customerId },
      }),
      providesTags: ["Customer"],
    }),

    // Update customer
    updateCustomer: builder.mutation({
      query: ({ customerId, ...rest }) => ({
        url: "/update",
        method: "PUT",
        body: { customerId, ...rest },
      }),
      invalidatesTags: ["Customer"],
    }),

    // Delete customer
    deleteCustomer: builder.mutation({
      query: (customerId) => ({
        url: "/delete",
        method: "DELETE",
        body: { id: customerId },
      }),
      invalidatesTags: ["Customer"],
    }),

    // Bulk Upload Consignees
    bulkUploadConsignees: builder.mutation({
      query: ({ customerId, consignees }) => ({
        url: "/consignees/bulk-upload",
        method: "POST",
        body: { customerId, consignees },
      }),
      invalidatesTags: ["Customer"],
    }),

    // Bulk Upload Consignors
    bulkUploadConsignors: builder.mutation({
      query: ({ customerId, consignors }) => ({
        url: "/consignors/bulk-upload",
        method: "POST",
        body: { customerId, consignors },
      }),
      invalidatesTags: ["Customer"],
    }),

    // Export Consignees
    exportConsignees: builder.query({
      query: (customerId) => ({
        url: `/consignees/export/${customerId}`,
        method: "GET",
      }),
    }),

    // Export Consignors
    exportConsignors: builder.query({
      query: (customerId) => ({
        url: `/consignors/export/${customerId}`,
        method: "GET",
      }),
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
} = customerApi;
