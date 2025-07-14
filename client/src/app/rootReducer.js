import { authApi } from "@/features/api/authApi.js";
import authReducer from "../features/authSlice.js";
import { combineReducers } from "@reduxjs/toolkit";
import { countryApi } from "@/features/api/Region/countryApi.js";
import { stateApi } from "@/features/api/Region/stateApi.js";
import { cityApi } from "@/features/api/Region/cityApi.js";
import { localityApi } from "@/features/api/Region/LocalityApi.js";
import { pincodeApi } from "@/features/api/Region/pincodeApi.js";
import { companyApi } from "@/features/api/Company/companyApi.js";
import { branchApi } from "@/features/api/Branch/branchApi.js";
import { goodsApi } from "@/features/api/Goods/goodsApi.js";
import { customerApi } from "@/features/api/Customer/customerApi.js";
import { vehicleApi } from "@/features/api/Vehicle/vehicleApi.js";
import { vendorApi } from "@/features/api/Vendor/vendorApi.js";
import { invoiceApi } from "@/features/api/Invoice/invoiceApi.js";
import { driverInvoiceApi } from "@/features/api/DriverInvoice/driverInvoiceApi.js";
import { siteTypeApi } from "@/features/api/SiteType/siteTypeApi.js";
import { transportModeApi } from "@/features/api/TransportMode/transportModeApi.js";

const rootReducer = combineReducers({
  [authApi.reducerPath]: authApi.reducer,
  [countryApi.reducerPath]: countryApi.reducer,
  [stateApi.reducerPath]: stateApi.reducer,
  [cityApi.reducerPath]: cityApi.reducer,
  [localityApi.reducerPath]: localityApi.reducer,
  [pincodeApi.reducerPath]: pincodeApi.reducer,
  [companyApi.reducerPath]: companyApi.reducer,
  [branchApi.reducerPath]: branchApi.reducer,
  [goodsApi.reducerPath]: goodsApi.reducer,
  [customerApi.reducerPath]: customerApi.reducer,
  [vehicleApi.reducerPath]: vehicleApi.reducer,
  [vendorApi.reducerPath]: vendorApi.reducer,
  [invoiceApi.reducerPath]: invoiceApi.reducer,
  [driverInvoiceApi.reducerPath]: driverInvoiceApi.reducer,
  [siteTypeApi.reducerPath]: siteTypeApi.reducer,
  [transportModeApi.reducerPath]: transportModeApi.reducer,

  auth: authReducer,
});

export default rootReducer;
