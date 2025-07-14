import { BASE_URL } from "@/utils/BaseUrl";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const SITE_TYPE_API = `${BASE_URL}/site-types`;

export const siteTypeApi = createApi({
  reducerPath: "siteTypeApi",
  baseQuery: fetchBaseQuery({
    baseUrl: SITE_TYPE_API,
    credentials: "include",
  }),
  tagTypes: ["SiteType"],
  endpoints: (builder) => ({
    // Create a site type
    createSiteType: builder.mutation({
      query: (data) => ({
        url: "/create",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["SiteType"],
    }),

    // Fetch all site types with pagination/search/status
    getAllSiteTypes: builder.query({
      query: ({ page = 1, limit = "", search = "", status = "" }) => ({
        url: "/all",
        method: "GET",
        params: { page, limit, search, status },
      }),
      providesTags: ["SiteType"],
    }),

    // Get a single site type by ID
    getSiteTypeById: builder.mutation({
      query: (siteTypeId) => ({
        url: "/view",
        method: "POST",
        body: { siteTypeId },
      }),
      providesTags: ["SiteType"],
    }),

    // Update site type
    updateSiteType: builder.mutation({
      query: (data) => ({
        url: "/update",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["SiteType"],
    }),

    // Delete a site type by ID
    deleteSiteType: builder.mutation({
      query: (siteTypeId) => ({
        url: "/delete",
        method: "DELETE",
        body: { siteTypeId },
      }),
      invalidatesTags: ["SiteType"],
    }),
  }),
});

export const {
  useCreateSiteTypeMutation,
  useGetAllSiteTypesQuery,
  useGetSiteTypeByIdMutation,
  useUpdateSiteTypeMutation,
  useDeleteSiteTypeMutation,
} = siteTypeApi; 