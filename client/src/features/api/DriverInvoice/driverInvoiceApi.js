import { BASE_URL } from "@/utils/BaseUrl";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const DRIVER_INVOICE_API = `${BASE_URL}/driver`;

// Driver Invoice API Slice
export const driverInvoiceApi = createApi({
  reducerPath: "driverInvoiceApi",
  baseQuery: fetchBaseQuery({
    baseUrl: DRIVER_INVOICE_API,
    credentials: "include",
  }),
  tagTypes: ["DriverInvoice"],
  endpoints: (builder) => ({
    // Fetch all driver invoices with pagination, search
    getDriverInvoices: builder.query({
      query: ({
        page = 1,
        limit = 50,
        search = "",
        driverId,
        fromDate,
        toDate,
      }) => ({
        url: "/driver-invoices",
        method: "POST",
        params: { page, limit, search },
        body: {
          driverId,
          ...(fromDate && { fromDate }),
          ...(toDate && { toDate }),
        }, // Use body if needed for POST alternative
      }),
      providesTags: ["DriverInvoice"],
    }),

    // Get driver invoices from last 24 hours
    getRecentDriverInvoices: builder.mutation({
      query: ({ page = 1, limit = 50, search = "", driverId }) => ({
        url: "/recent-invoice",
        method: "POST",
        params: { page, limit, search },
        body: { driverId },
      }),
      providesTags: ["DriverInvoice"],
    }),

    // Update invoice status and upload photo (multipart form data)
    updateDriverInvoice: builder.mutation({
      query: (formData) => ({
        url: "/update-driver-invoice",
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["DriverInvoice"],
    }),
  }),
});

export const {
  useGetDriverInvoicesQuery,
  useGetRecentDriverInvoicesMutation,
  useUpdateDriverInvoiceMutation,
} = driverInvoiceApi;
