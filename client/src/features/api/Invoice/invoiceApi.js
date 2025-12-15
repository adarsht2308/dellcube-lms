import { BASE_URL } from "@/utils/BaseUrl";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getTokenData } from "@/utils/getTokenData";

const INVOICE_API = `${BASE_URL}/invoices`;

export const invoiceApi = createApi({
  reducerPath: "invoiceApi",
  baseQuery: fetchBaseQuery({
    baseUrl: INVOICE_API,
    credentials: "include",
  }),
  tagTypes: ["Invoice"],
  endpoints: (builder) => ({
    createInvoice: builder.mutation({
      query: (payload) => {
        // Get companyId and branchId from token
        const { companyId: tokenCompanyId, branchId: tokenBranchId } = getTokenData();
        
        // Add companyId and branchId to payload if not already present
        const finalPayload = {
          ...payload,
          ...(tokenCompanyId && !payload.company && { company: tokenCompanyId }),
          ...(tokenBranchId && !payload.branch && { branch: tokenBranchId }),
        };
        
        return {
          url: "/create",
          method: "POST",
          body: finalPayload,
        };
      },
      invalidatesTags: ["Invoice"],
    }),

    getAllInvoices: builder.query({
      query: ({
        page = 1,
        limit = 10,
        search = "",
        companyId = "",
        branchId = "",
        customerId = "",
        status = "",
        paymentType = "",
        fromDate = "",
        toDate = "",
      }) => {
        // Get companyId and branchId from token if not provided
        const { companyId: tokenCompanyId, branchId: tokenBranchId } = getTokenData();
        const finalCompanyId = companyId || tokenCompanyId || "";
        const finalBranchId = branchId || tokenBranchId || "";
        
        return {
          url: "/all",
          method: "GET",
          params: {
            page,
            limit,
            search,
            companyId: finalCompanyId,
            branchId: finalBranchId,
            customerId,
            status,
            paymentType,
            fromDate,
            toDate,
          },
        };
      },
      providesTags: ["Invoice"],
    }),

    getInvoiceById: builder.mutation({
      query: (invoiceId) => ({
        url: "/view",
        method: "POST",
        body: { invoiceId },
      }),
      providesTags: ["Invoice"],
    }),

    updateInvoice: builder.mutation({
      query: ({ invoiceId, ...rest }) => {
        // Get companyId and branchId from token
        const { companyId: tokenCompanyId, branchId: tokenBranchId } = getTokenData();
        
        // Add companyId and branchId to payload if not already present
        const finalPayload = {
          invoiceId,
          ...rest,
          ...(tokenCompanyId && !rest.company && { company: tokenCompanyId }),
          ...(tokenBranchId && !rest.branch && { branch: tokenBranchId }),
        };
        
        return {
          url: "/update",
          method: "PUT",
          body: finalPayload,
        };
      },
      invalidatesTags: ["Invoice"],
    }),

    deleteInvoice: builder.mutation({
      query: (invoiceId) => ({
        url: "/delete",
        method: "DELETE",
        body: { invoiceId },
      }),
      invalidatesTags: ["Invoice"],
    }),

    getInvoicePdf: builder.mutation({
      query: (invoiceId) => ({
        url: `/${invoiceId}/pdf`,
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
    }),

    exportInvoicesCSV: builder.mutation({
      query: (params) => {
        return {
          url: "/export-csv",
          method: "GET",
          params,
          responseHandler: (response) => response.blob(),
        };
      },
    }),

    createReservedDockets: builder.mutation({
      query: (payload) => {
        // Get companyId and branchId from token
        const { companyId: tokenCompanyId, branchId: tokenBranchId } = getTokenData();
        
        // Add companyId and branchId to payload if not already present
        const finalPayload = {
          ...payload,
          ...(tokenCompanyId && !payload.company && { company: tokenCompanyId }),
          ...(tokenBranchId && !payload.branch && { branch: tokenBranchId }),
        };
        
        return {
          url: "/reserve",
          method: "POST",
          body: finalPayload,
        };
      },
      invalidatesTags: ["Invoice"],
    }),
  }),
});

export const {
  useCreateInvoiceMutation,
  useGetAllInvoicesQuery,
  useGetInvoiceByIdMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
  useGetInvoicePdfMutation,
  useExportInvoicesCSVMutation,
  useCreateReservedDocketsMutation,
} = invoiceApi;
