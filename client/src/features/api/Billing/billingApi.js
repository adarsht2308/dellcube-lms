import { BASE_URL } from "@/utils/BaseUrl";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BILLING_API = `${BASE_URL}/billing`;

export const billingApi = createApi({
  reducerPath: "billingApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BILLING_API,
    credentials: "include",
  }),
  tagTypes: ["BillingRate", "BillingInvoice", "BillingDocket"],
  endpoints: (builder) => ({
    getRates: builder.query({
      query: (params = {}) => ({ url: "/rates", method: "GET", params }),
      providesTags: ["BillingRate"],
    }),
    createRate: builder.mutation({
      query: (body) => ({ url: "/rates", method: "POST", body }),
      invalidatesTags: ["BillingRate"],
    }),
    updateRate: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/rates/${id}`, method: "PUT", body }),
      invalidatesTags: ["BillingRate"],
    }),
    deleteRate: builder.mutation({
      query: (id) => ({ url: `/rates/${id}`, method: "DELETE" }),
      invalidatesTags: ["BillingRate"],
    }),
    getBillingDockets: builder.query({
      query: (params = {}) => ({ url: "/dockets", method: "GET", params }),
      providesTags: ["BillingDocket"],
    }),
    generateBillingInvoice: builder.mutation({
      query: (body) => ({ url: "/invoices/generate", method: "POST", body }),
      invalidatesTags: ["BillingInvoice"],
    }),
    getBillingInvoices: builder.query({
      query: (params = {}) => ({ url: "/invoices", method: "GET", params }),
      providesTags: ["BillingInvoice"],
    }),
    getBillingInvoiceById: builder.query({
      query: (id) => ({ url: `/invoices/${id}`, method: "GET" }),
      providesTags: ["BillingInvoice"],
    }),
    updateBillingInvoiceStatus: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/invoices/${id}/status`, method: "PUT", body }),
      invalidatesTags: ["BillingInvoice"],
    }),
    addBillingPayment: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/invoices/${id}/payments`, method: "POST", body }),
      invalidatesTags: ["BillingInvoice"],
    }),
  }),
});

export const {
  useGetRatesQuery,
  useCreateRateMutation,
  useUpdateRateMutation,
  useDeleteRateMutation,
  useGetBillingDocketsQuery,
  useGenerateBillingInvoiceMutation,
  useGetBillingInvoicesQuery,
  useGetBillingInvoiceByIdQuery,
  useUpdateBillingInvoiceStatusMutation,
  useAddBillingPaymentMutation,
} = billingApi;
