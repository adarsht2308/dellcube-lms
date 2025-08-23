import { BASE_URL } from "@/utils/BaseUrl";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const VEHICLE_API = `${BASE_URL}/vehicles`;

export const vehicleApi = createApi({
  reducerPath: "vehicleApi",
  baseQuery: fetchBaseQuery({
    baseUrl: VEHICLE_API,
    credentials: "include",
    prepareHeaders: (headers, { getState, endpoint }) => {
      // Log headers for debugging
      console.log("=== RTK Query Headers ===");
      console.log("endpoint:", endpoint);
      console.log("headers:", headers);
      return headers;
    },
  }),
  tagTypes: ["Vehicle"],
  endpoints: (builder) => ({
    // Create a new vehicle
    createVehicle: builder.mutation({
      query: (payload) => ({
        url: "/create",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Vehicle"],
    }),

    // Get all vehicles with pagination, search, filters
    getAllVehicles: builder.query({
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
      providesTags: ["Vehicle"],
    }),

    // Get single vehicle by ID
    getVehicleById: builder.mutation({
      query: (vehicleId) => ({
        url: "/view",
        method: "POST",
        body: { id: vehicleId },
      }),
      providesTags: ["Vehicle"],
    }),

    // Update vehicle
    updateVehicle: builder.mutation({
      query: (payload) => ({
        url: "/update",
        method: "PUT",
        body: payload,
        // Let fetchBaseQuery set the Content-Type automatically for FormData
      }),
      invalidatesTags: ["Vehicle"],
    }),

    // Delete vehicle
    deleteVehicle: builder.mutation({
      query: (vehicleId) => ({
        url: "/delete",
        method: "DELETE",
        body: { id: vehicleId },
      }),
      invalidatesTags: ["Vehicle"],
    }),

    addMaintenance: builder.mutation({
      query: (payload) => {
        // Check if payload is FormData (for file uploads)
        const isFormData = payload instanceof FormData;
        
        return {
          url: "/vehicle/maintenance",
          method: "PUT",
          body: payload,
          // Don't set Content-Type for FormData, let the browser set it with boundary
          ...(isFormData ? {} : { headers: { 'Content-Type': 'application/json' } }),
        };
      },
      invalidatesTags: ["Vehicle"],
    }),

    getVehiclesByBranch: builder.query({
        query: (branchId) => `branch/${branchId}`,
    }),
    searchVehicles: builder.mutation({
        query: ({ vehicleNumber, companyId, branchId }) => ({
          url: `/search?vehicleNumber=${vehicleNumber}&companyId=${companyId}&branchId=${branchId}`,
          method: 'GET',
        }),
      }),
  }),
});

export const {
  useCreateVehicleMutation,
  useGetAllVehiclesQuery,
  useGetVehicleByIdMutation,
  useUpdateVehicleMutation,
  useDeleteVehicleMutation,
  useAddMaintenanceMutation,
  useGetVehiclesByCompanyQuery,
  useGetVehiclesByBranchQuery,
  useSearchVehiclesMutation,
} = vehicleApi;
