import { BASE_URL } from "@/utils/BaseUrl";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const VEHICLE_API = `${BASE_URL}/vehicles`;

export const vehicleApi = createApi({
  reducerPath: "vehicleApi",
  baseQuery: fetchBaseQuery({
    baseUrl: VEHICLE_API,
    credentials: "include",
    prepareHeaders: (headers, { getState, endpoint }) => {
      console.log("=== RTK Query Headers ===");
      console.log("endpoint:", endpoint);
      console.log("headers:", headers);
      return headers;
    },
  }),
  tagTypes: ["Vehicle"],
  endpoints: (builder) => ({
    createVehicle: builder.mutation({
      query: (payload) => ({
        url: "create",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Vehicle"],
    }),

    getAllVehicles: builder.query({
      query: ({
        page = 1,
        limit = 10,
        search = "",
        status = "",
        companyId = "",
        branchId = "",
      }) => ({
        url: "all",
        method: "GET",
        params: { page, limit, search, status, companyId, branchId },
      }),
      providesTags: ["Vehicle"],
    }),

    getVehicleById: builder.mutation({
      query: (vehicleId) => ({
        url: "view",
        method: "POST",
        body: { id: vehicleId },
      }),
      providesTags: ["Vehicle"],
    }),

    updateVehicle: builder.mutation({
      query: (payload) => ({
        url: "update",
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Vehicle"],
    }),

    deleteVehicle: builder.mutation({
      query: (vehicleId) => ({
        url: "delete",
        method: "DELETE",
        body: { id: vehicleId },
      }),
      invalidatesTags: ["Vehicle"],
    }),

    addMaintenance: builder.mutation({
      query: (payload) => {
        const isFormData = payload instanceof FormData;
        
        return {
          url: "vehicle/maintenance",
          method: "PUT",
          body: payload,
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
          url: `search?vehicleNumber=${vehicleNumber}&companyId=${companyId}&branchId=${branchId}`,
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
