import { BASE_URL } from "@/utils/BaseUrl";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const VENDOR_API = `${BASE_URL}/vendors`;

export const vendorApi = createApi({
  reducerPath: "vendorApi", // Unique reducer path for this API slice
  baseQuery: fetchBaseQuery({
    baseUrl: VENDOR_API,
    credentials: "include", // Ensure cookies/auth tokens are sent
  }),
  // Define tag types for caching and invalidation
  tagTypes: ["Vendor", "VendorVehicle"], // Added VendorVehicle for clarity if you manage these separately

  endpoints: (builder) => ({
    // <--- 'builder' is defined here
    // 1. Create a new vendor (POST /api/vendors/create)
    createVendor: builder.mutation({
      query: (payload) => ({
        url: "/create",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Vendor"], // Invalidate 'Vendor' cache after creation
    }),

    // 2. Get all vendors (GET /api/vendors/all)
    // This will be used to populate the initial "Select Vendor" dropdown
    getAllVendors: builder.query({
      query: ({
        page = 1,
        limit = 50,
        search = "", // For searching by vendor name
        status = "",
        companyId = "",
        branchId = "", // For filtering by vendor status
      } = {}) => ({
        // Default empty object for query parameters
        url: "/all",
        method: "GET",
        params: { page, limit, search, status, companyId, branchId },
      }),
      providesTags: ["Vendor"], // Provide 'Vendor' tag for caching
    }),

    // 3. Get a single vendor by ID (POST /api/vendors/view)
    getVendorById: builder.mutation({
      // Using mutation as per your backend's POST /view
      query: (vendorId) => ({
        url: "/view",
        method: "POST",
        body: { id: vendorId }, // Send ID in the body
      }),
      providesTags: ["Vendor"],
    }),

    // 4. Update vendor (PUT /api/vendors/update)
    updateVendor: builder.mutation({
      query: ({ vendorId, ...rest }) => ({
        url: "/update",
        method: "PUT",
        body: { vendorId, ...rest }, // Send vendorId and other updates in the body
      }),
      invalidatesTags: ["Vendor"], // Invalidate 'Vendor' cache after update
    }),

    // 5. Delete vendor (DELETE /api/vendors/delete)
    deleteVendor: builder.mutation({
      query: (vendorId) => ({
        url: "/delete",
        method: "DELETE",
        body: { id: vendorId }, // Send ID in the body
      }),
      invalidatesTags: ["Vendor"], // Invalidate 'Vendor' cache after deletion
    }),

    // 6. Add a vehicle to a vendor's fleet (PUT /api/vendors/vendor/vehicles)
    // This is now correctly inside the endpoints object
    addVehicle: builder.mutation({
      query: ({ vendorId, vehicle }) => ({
        url: "/vendor/vehicles", // Ensure this matches your backend route
        method: "PUT", // Or POST, depending on how your backend handles adding to an array
        body: { vendorId, vehicle },
      }),
      invalidatesTags: ["Vendor"], // Invalidate 'Vendor' cache as its vehicles array has changed
    }),

    // 7. Update a vehicle's status in a vendor's availableVehicles
    updateVendorVehicleStatus: builder.mutation({
      query: ({ vendorId, vehicleId, status }) => ({
        url: "/vendor/vehicle/status",
        method: "PUT",
        body: { vendorId, vehicleId, status },
      }),
      invalidatesTags: ["Vendor"],
    }),
  }), // <--- End of endpoints object
});

// Export the hooks for use in your React components
export const {
  useCreateVendorMutation,
  useGetAllVendorsQuery,
  useGetVendorByIdMutation,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
  useAddVehicleMutation, // Export the new hook
  useUpdateVendorVehicleStatusMutation,
} = vendorApi;
