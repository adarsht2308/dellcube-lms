import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./rootReducer.js";
import { authApi } from "@/features/api/authApi.js";
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

export const appStore = configureStore({
  reducer: rootReducer,
  middleware: (defaultMiddleware) =>
    defaultMiddleware().concat(
      authApi.middleware,
      countryApi.middleware,
      stateApi.middleware,
      cityApi.middleware,
      localityApi.middleware,
      pincodeApi.middleware,
      companyApi.middleware,
      branchApi.middleware,
      goodsApi.middleware,
      customerApi.middleware,
      vehicleApi.middleware,
      vendorApi.middleware,
      invoiceApi.middleware,
      driverInvoiceApi.middleware,
      siteTypeApi.middleware,
      transportModeApi.middleware
    ),
});

const initializeApp = async () => {
  await appStore.dispatch(
    authApi.endpoints.loadUser.initiate({}, { forceRefetch: true })
  );
};
initializeApp();
