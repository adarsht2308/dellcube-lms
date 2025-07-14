import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { userLoggedIn, userLoggedOut } from "../authSlice";
import { BASE_URL } from "@/utils/BaseUrl";

// const USER_API = "https://dellcube-lms.onrender.com/api/user";
const USER_API = `${BASE_URL}/user`;

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: USER_API,
    credentials: "include",
  }),
  tagTypes: ["User", "BranchAdmin", "Driver"],

  endpoints: (builder) => ({
    registerUser: builder.mutation({
      query: (inputData) => ({
        url: "register",
        method: "POST",
        body: inputData,
      }),
    }),
    verifyOTP: builder.mutation({
      query: ({ email, otp }) => ({
        url: "verify-otp",
        method: "POST",
        body: { email, otp },
      }),
    }),
    loginUser: builder.mutation({
      query: (inputData) => ({
        url: "login",
        method: "POST",
        body: inputData,
      }),
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          dispatch(userLoggedIn({ user: result.data.user }));
        } catch (error) {
          console.log(error);
        }
      },
    }),
    logoutUser: builder.mutation({
      query: () => ({
        url: "logout",
        method: "GET",
      }),
      async onQueryStarted(_, { dispatch }) {
        try {
          dispatch(userLoggedOut({ user: null }));
        } catch (error) {
          console.log(error);
        }
      },
    }),
    loadUser: builder.query({
      query: () => ({
        url: "profile",
        method: "GET",
      }),
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          dispatch(userLoggedIn({ user: result.data.user }));
        } catch (error) {
          console.log(error);
        }
      },
    }),
    updateUser: builder.mutation({
      query: (formData) => ({
        url: "update-profile",
        method: "PUT",
        body: formData,
      }),
    }),

    createBranchAdmin: builder.mutation({
      query: (inputData) => ({
        url: "create-branch-admin",
        method: "POST",
        body: inputData,
      }),
      invalidatesTags: ["BranchAdmin"],
    }),

    getAllBranchAdmins: builder.query({
      query: ({
        page = 1,
        limit = 10,
        search = "",
        status = "",
        company = "",
        branch = "",
      }) => ({
        url: "all/branch-admins",
        method: "GET",
        params: { page, limit, search, status, company, branch },
      }),
      providesTags: ["BranchAdmin"],
    }),

    getBranchAdminById: builder.mutation({
      query: ({ id }) => ({
        url: 'view/branch-admin',
        method: "POST",
        body: { id }
      }),
      providesTags: (result, error, id) => [{ type: "BranchAdmin", id }],
    }),

    deleteBranchAdmin: builder.mutation({
      query: (id) => ({
        url: 'delete/branch-admin',
        method: "DELETE",
        body: { id }
      }),
      invalidatesTags: ["BrancAdmin"]
    }),
    updateBranchAdmin: builder.mutation({
      query: (formData) => ({
        url: "update-branch-admin",
        method: "PUT",
        body: formData,
      }),
    }),

    //Operations
    createOperationUser: builder.mutation({
      query: (inputData) => ({
        url: "/create-operations",
        method: "POST",
        body: inputData,
      }),
      invalidatesTags: ["OperationUser"],
    }),

    // Get All Operation Users
    getAllOperationUsers: builder.query({
      query: ({
        page = 1,
        limit = 10,
        search = "",
        status = "",
        company = "",
        branch = "",
      }) => ({
        url: "/all-operations",
        method: "GET",
        params: { page, limit, search, status, company, branch },
      }),
      providesTags: ["OperationUser"],
    }),

    // Get Operation User by ID
    getOperationUserById: builder.mutation({
      query: ({ id }) => ({
        url: "/view-operations",
        method: "POST",
        body: { id },
      }),
      providesTags: (result, error, { id }) => [{ type: "OperationUser", id }],
    }),

    // Delete Operation User
    deleteOperationUser: builder.mutation({
      query: (id) => ({
        url: "/delete-operations",
        method: "DELETE",
        body: { id },
      }),
      invalidatesTags: ["OperationUser"],
    }),

    // Update Operation User
    updateOperationUser: builder.mutation({
      query: (formData) => ({
        url: "/update-operations",
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["OperationUser"],
    }),

    //Driver
    createDriver: builder.mutation({
      query: (inputData) => ({
        url: "create-driver",
        method: "POST",
        body: inputData,
      }),
      invalidatesTags: ["Driver"],
    }),

    getAllDrivers: builder.query({
      query: ({
        page = 1,
        limit = 10,
        search = "",
        status = "",
        company = "",
        branch = "",
      }) => ({
        url: "/all-drivers",
        method: "GET",
        params: { page, limit, search, status, company, branch },
      }),
      providesTags: ["Driver"],
    }),

    getDriverById: builder.mutation({
      query: ({ id }) => ({
        url: "/view-driver",
        method: "POST",
        body: { id },
      }),
      providesTags: (result, error, id) => [{ type: "Driver", id }],
    }),

    updateDriver: builder.mutation({
      query: (formData) => ({
        url: "/update-driver",
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["Driver"],
    }),

    deleteDriver: builder.mutation({
      query: (id) => ({
        url: "/delete-driver",
        method: "DELETE",
        body: { id },
      }),
      invalidatesTags: ["Driver"],
    }),
  }),
});

export const {
  useRegisterUserMutation,
  useVerifyOTPMutation,
  useLoginUserMutation,
  useLogoutUserMutation,
  useLoadUserQuery,
  useUpdateUserMutation,
  useCreateBranchAdminMutation,
  useGetAllBranchAdminsQuery,
  useGetBranchAdminByIdMutation,
  useDeleteBranchAdminMutation,
  useUpdateBranchAdminMutation,
  useCreateOperationUserMutation,
  useDeleteOperationUserMutation,
  useGetAllOperationUsersQuery,
  useGetOperationUserByIdMutation,
  useUpdateOperationUserMutation,
  useCreateDriverMutation,
  useDeleteDriverMutation,
  useGetAllDriversQuery,
  useGetDriverByIdMutation,
  useUpdateDriverMutation
} = authApi;
