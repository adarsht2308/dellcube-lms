import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getTokenData } from "./getTokenData";

/**
 * Creates a base query with automatic companyId and branchId injection from token
 * Note: The backend middleware extracts companyId/branchId from token automatically.
 * This utility adds them to headers for reference, but backend primarily uses token.
 * @param {string} baseUrl - The base URL for the API
 * @param {Object} options - Additional options for fetchBaseQuery
 * @returns {Function} Configured baseQuery function
 */
export const createApiBaseQuery = (baseUrl, options = {}) => {
  const originalPrepareHeaders = options.prepareHeaders;
  
  return fetchBaseQuery({
    baseUrl,
    credentials: "include",
    ...options,
    prepareHeaders: (headers, api) => {
      // Get companyId and branchId from token
      const { companyId, branchId } = getTokenData();
      
      // Add companyId and branchId to headers if available (for reference)
      if (companyId) {
        headers.set("x-company-id", companyId);
      }
      if (branchId) {
        headers.set("x-branch-id", branchId);
      }
      
      // Call original prepareHeaders if provided
      if (originalPrepareHeaders) {
        return originalPrepareHeaders(headers, api);
      }
      
      return headers;
    },
  });
};

