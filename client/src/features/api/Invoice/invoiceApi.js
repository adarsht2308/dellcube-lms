import { BASE_URL } from "@/utils/BaseUrl";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getTokenData } from "@/utils/getTokenData";

const INVOICE_API = `${BASE_URL}/invoices`;

// Custom baseQuery with retry logic and better error handling
const baseQueryWithRetry = async (args, api, extraOptions) => {
  const baseQuery = fetchBaseQuery({
    baseUrl: INVOICE_API,
    credentials: "include",
  });

  // For 502 errors, retry up to 2 times with exponential backoff
  let result = await baseQuery(args, api, extraOptions);
  
  if (result.error) {
    const status = result.error?.status || result.error?.data?.status;
    const is502Error = status === 502 || 
                       result.error?.message?.includes("502") ||
                       result.error?.message?.includes("Bad Gateway") ||
                       result.error?.message?.includes("Failed to fetch");

    if (is502Error) {
      // Retry logic for 502 errors
      for (let i = 0; i < 2; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
        result = await baseQuery(args, api, extraOptions);
        if (!result.error || (result.error?.status !== 502 && !result.error?.message?.includes("502"))) {
          break; // Success or different error
        }
      }
    }
  }

  return result;
};

export const invoiceApi = createApi({
  reducerPath: "invoiceApi",
  baseQuery: baseQueryWithRetry,
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

    getNextDocketNumber: builder.query({
      query: ({ companyId, branchId }) => {
        // Get companyId and branchId from token if not provided
        const { companyId: tokenCompanyId, branchId: tokenBranchId } = getTokenData();
        const finalCompanyId = companyId || tokenCompanyId || "";
        const finalBranchId = branchId || tokenBranchId || "";
        
        return {
          url: "/next-docket-number",
          method: "GET",
          params: {
            companyId: finalCompanyId,
            branchId: finalBranchId,
          },
        };
      },
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
  useGetNextDocketNumberQuery,
} = invoiceApi;
