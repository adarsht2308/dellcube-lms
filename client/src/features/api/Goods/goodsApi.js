import { BASE_URL } from "@/utils/BaseUrl";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const GOODS_API =  `${BASE_URL}/goods`;

export const goodsApi = createApi({
  reducerPath: "goodsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: GOODS_API,
    credentials: "include",
  }),
  tagTypes: ["Goods"],
  endpoints: (builder) => ({
    createGood: builder.mutation({
      query: (payload) => ({
        url: "/create",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Goods"],
    }),

    getAllGoods: builder.query({
      query: ({ page = 1, limit = "", search = "" }) => ({
        url: "/all",
        method: "GET",
        params: { page, limit, search },
      }),
      providesTags: ["Goods"],
    }),

    getGoodById: builder.mutation({
      query: (goodId) => ({
        url: "/view",
        method: "POST",
        body: { id: goodId },
      }),
      providesTags: ["Goods"],
    }),

    updateGood: builder.mutation({
      query: ({ id, name, description, items }) => ({
        url: "/update",
        method: "PUT",
        body: { id, name, description, items },
      }),
      invalidatesTags: ["Goods"],
    }),

    deleteGood: builder.mutation({
      query: (goodId) => ({
        url: "/delete",
        method: "DELETE",
        body: { id: goodId },
      }),
      invalidatesTags: ["Goods"],
    }),
  }),
});

export const {
  useCreateGoodMutation,
  useGetAllGoodsQuery,
  useGetGoodByIdMutation,
  useUpdateGoodMutation,
  useDeleteGoodMutation,
} = goodsApi;
