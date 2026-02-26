import { BASE_URL } from "@/utils/BaseUrl";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getTokenData } from "@/utils/getTokenData";

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
      query: (payload) => {
        // Get companyId and branchId from token
        const { companyId: tokenCompanyId, branchId: tokenBranchId } = getTokenData();
        
        // If payload is FormData, append companyId and branchId if not already present
        if (payload instanceof FormData) {
          if (tokenCompanyId && !payload.has("company")) {
            payload.append("company", tokenCompanyId);
          }
          if (tokenBranchId && !payload.has("branch")) {
            payload.append("branch", tokenBranchId);
          }
        } else {
          // If payload is an object, add companyId and branchId if not already present
          payload = {
            ...payload,
            ...(tokenCompanyId && !payload.company && { company: tokenCompanyId }),
            ...(tokenBranchId && !payload.branch && { branch: tokenBranchId }),
          };
        }
        
        return {
          url: "create",
          method: "POST",
          body: payload,
        };
      },
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
      }) => {
        // Get companyId and branchId from token if not provided
        const { companyId: tokenCompanyId, branchId: tokenBranchId } = getTokenData();
        const finalCompanyId = companyId || tokenCompanyId || "";
        const finalBranchId = branchId || tokenBranchId || "";
        
        return {
          url: "all",
          method: "GET",
          params: { page, limit, search, status, companyId: finalCompanyId, branchId: finalBranchId },
        };
      },
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
      query: (payload) => {
        // Get companyId and branchId from token
        const { companyId: tokenCompanyId, branchId: tokenBranchId } = getTokenData();
        
        // If payload is FormData, append companyId and branchId if not already present
        if (payload instanceof FormData) {
          if (tokenCompanyId && !payload.has("company")) {
            payload.append("company", tokenCompanyId);
          }
          if (tokenBranchId && !payload.has("branch")) {
            payload.append("branch", tokenBranchId);
          }
        } else {
          // If payload is an object, add companyId and branchId if not already present
          payload = {
            ...payload,
            ...(tokenCompanyId && !payload.company && { company: tokenCompanyId }),
            ...(tokenBranchId && !payload.branch && { branch: tokenBranchId }),
          };
        }
        
        return {
          url: "update",
          method: "PUT",
          body: payload,
        };
      },
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
        query: ({ vehicleNumber, companyId, branchId }) => {
          // Get companyId and branchId from token if not provided
          const { companyId: tokenCompanyId, branchId: tokenBranchId } = getTokenData();
          const finalCompanyId = companyId || tokenCompanyId || "";
          const finalBranchId = branchId || tokenBranchId || "";
          
          return {
            url: `search?vehicleNumber=${vehicleNumber}&companyId=${finalCompanyId}&branchId=${finalBranchId}`,
            method: 'GET',
          };
        },
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
