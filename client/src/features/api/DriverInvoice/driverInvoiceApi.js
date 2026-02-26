import { BASE_URL } from "@/utils/BaseUrl";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getTokenData } from "@/utils/getTokenData";

const DRIVER_INVOICE_API = `${BASE_URL}/driver`;

export const driverInvoiceApi = createApi({
  reducerPath: "driverInvoiceApi",
  baseQuery: fetchBaseQuery({
    baseUrl: DRIVER_INVOICE_API,
    credentials: "include",
  }),
  tagTypes: ["DriverInvoice"],
  endpoints: (builder) => ({
    getDriverInvoices: builder.query({
      query: ({
        page = 1,
        limit = 50,
        search = "",
        driverId,
        fromDate,
        toDate,
      }) => {
        // Get companyId and branchId from token
        const { companyId: tokenCompanyId, branchId: tokenBranchId } = getTokenData();
        
        return {
          url: "/driver-invoices",
          method: "POST",
          params: { page, limit, search },
          body: {
            driverId,
            ...(fromDate && { fromDate }),
            ...(toDate && { toDate }),
            ...(tokenCompanyId && { companyId: tokenCompanyId }),
            ...(tokenBranchId && { branchId: tokenBranchId }),
          },
        };
      },
      providesTags: ["DriverInvoice"],
    }),

    getRecentDriverInvoices: builder.mutation({
      query: ({ page = 1, limit = 50, search = "", driverId }) => {
        // Get companyId and branchId from token
        const { companyId: tokenCompanyId, branchId: tokenBranchId } = getTokenData();
        
        return {
          url: "/recent-invoice",
          method: "POST",
          params: { page, limit, search },
          body: {
            driverId,
            ...(tokenCompanyId && { companyId: tokenCompanyId }),
            ...(tokenBranchId && { branchId: tokenBranchId }),
          },
        };
      },
      providesTags: ["DriverInvoice"],
    }),

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
