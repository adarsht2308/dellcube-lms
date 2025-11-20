import { BASE_URL } from "@/utils/BaseUrl";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

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
      query: (payload) => ({
        url: "/create",
        method: "POST",
        body: payload,
      }),
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
      }) => ({
        url: "/all",
        method: "GET",
        params: {
          page,
          limit,
          search,
          companyId,
          branchId,
          customerId,
          status,
          paymentType,
          fromDate,
          toDate,
        },
      }),
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
      query: ({ invoiceId, ...rest }) => ({
        url: "/update",
        method: "PUT",
        body: { invoiceId, ...rest },
      }),
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
      query: (payload) => ({
        url: "/reserve",
        method: "POST",
        body: payload,
      }),
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
