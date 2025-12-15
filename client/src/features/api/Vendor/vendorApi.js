import { BASE_URL } from "@/utils/BaseUrl";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getTokenData } from "@/utils/getTokenData";

const VENDOR_API = `${BASE_URL}/vendors`;

export const vendorApi = createApi({
  reducerPath: "vendorApi",
  baseQuery: fetchBaseQuery({
    baseUrl: VENDOR_API,
    credentials: "include",
  }),
  tagTypes: ["Vendor", "VendorVehicle"],

  endpoints: (builder) => ({
    createVendor: builder.mutation({
      query: (payload) => ({
        url: "/create",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Vendor"],
    }),

    getAllVendors: builder.query({
      query: ({
        page = 1,
        limit = 50,
        search = "",
        status = "",
        companyId = "",
        branchId = "",
      } = {}) => {
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
      providesTags: ["Vendor"],
    }),

    getVendorById: builder.mutation({
      query: (vendorId) => ({
        url: "/view",
        method: "POST",
        body: { id: vendorId },
      }),
      providesTags: ["Vendor"],
    }),

    updateVendor: builder.mutation({
      query: (payload) => {
        if (payload instanceof FormData) {
          return {
            url: "/update",
            method: "PUT",
            body: payload,
          };
        } else {
          const { vendorId, ...rest } = payload;
          return {
            url: "/update",
            method: "PUT",
            body: { vendorId, ...rest },
          };
        }
      },
      invalidatesTags: ["Vendor"],
    }),

    deleteVendor: builder.mutation({
      query: (vendorId) => ({
        url: "/delete",
        method: "DELETE",
        body: { id: vendorId },
      }),
      invalidatesTags: ["Vendor"],
    }),

    addVehicle: builder.mutation({
      query: ({ vehicle }) => {
        if (vehicle instanceof FormData) {
          return {
            url: "/vendor/vehicles",
            method: "PUT",
            body: vehicle,
          };
        } else {
          return {
            url: "/vendor/vehicles",
            method: "PUT",
            body: vehicle,
          };
        }
      },
      invalidatesTags: ["Vendor"],
    }),

    updateVendorVehicleStatus: builder.mutation({
      query: ({ vendorId, vehicleId, status }) => ({
        url: "/vendor/vehicle/status",
        method: "PUT",
        body: { vendorId, vehicleId, status },
      }),
      invalidatesTags: ["Vendor"],
    }),

    addVendorVehicleMaintenance: builder.mutation({
      query: ({ maintenance }) => {
        if (maintenance instanceof FormData) {
          return {
            url: "/vendor/vehicle/maintenance",
            method: "PUT",
            body: maintenance,
          };
        } else {
          return {
            url: "/vendor/vehicle/maintenance",
            method: "PUT",
            body: maintenance,
          };
        }
      },
      invalidatesTags: ["Vendor"],
    }),

    getVendorInvoices: builder.query({
      query: () => ({
        url: "/my-invoices",
        method: "GET",
      }),
      providesTags: ["Vendor"],
    }),

    getVendorVehicles: builder.query({
      query: () => ({
        url: "/my-vehicles",
        method: "GET",
      }),
      providesTags: ["Vendor"],
    }),

    getVendorProfile: builder.query({
      query: () => ({
        url: "/my-profile",
        method: "GET",
      }),
      providesTags: ["Vendor"],
    }),

    updateVendorProfile: builder.mutation({
      query: (profileData) => ({
        url: "/my-profile",
        method: "PUT",
        body: profileData,
      }),
      invalidatesTags: ["Vendor"],
    }),
    testVendorInvoices: builder.query({
      query: () => ({
        url: "/test-invoices",
        method: "GET",
      }),
      providesTags: ["Vendor"],
    }),
  }),
});

export const {
  useCreateVendorMutation,
  useGetAllVendorsQuery,
  useGetVendorByIdMutation,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
  useAddVehicleMutation,
  useUpdateVendorVehicleStatusMutation,
  useAddVendorVehicleMaintenanceMutation,
  useGetVendorInvoicesQuery,
  useGetVendorVehiclesQuery,
  useGetVendorProfileQuery,
  useUpdateVendorProfileMutation,
  useTestVendorInvoicesQuery,
} = vendorApi;
