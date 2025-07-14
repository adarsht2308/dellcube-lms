import { createBrowserRouter, RouterProvider } from "react-router-dom";
import MainLayout from "./layout/MainLayout.jsx";
import { ThemeProvider } from "./components/ThemeProvider";
import Login from "./components/Login.jsx";
import Dashboard from "./components/admin/dashboard.jsx";
import VerifyOTP from "./components/verifyOtp.jsx";
import ContentLayout from "./layout/ContentLayout.jsx";
import Sidebar from "./components/admin/sidebar.jsx";
import Footer from "@/components/admin/Footer";
import Navbar from "@/components/admin/Navbar.jsx";
import Profile from "./components/admin/Profile.jsx";
import RoleProtectedRoute from "./utils/RoleProtectedRoute.jsx";
import UnAuthorized from "./utils/UnAuthorized.jsx";
import NotFound from "./utils/NotFound.jsx";
import CreateCountry from "./components/admin/Region/Country/CreateCountry.jsx";
import UpdateCountry from "./components/admin/Region/Country/UpdateCountry.jsx";
import Countries from "./components/admin/Region/Country/Countries.jsx";
import CreateState from "./components/admin/Region/State/CreateState.jsx";
import UpdateState from "./components/admin/Region/State/UpdateState.jsx";
import States from "./components/admin/Region/State/States.jsx";
import CreateCity from "./components/admin/Region/City/CreateCity.jsx";
import UpdateCity from "./components/admin/Region/City/UpdateCity.jsx";
import Cities from "./components/admin/Region/City/Cities.jsx";
import Localities from "./components/admin/Region/Locality/Localities.jsx";
import CreateLocality from "./components/admin/Region/Locality/CreateLocality.jsx";
import UpdateLocality from "./components/admin/Region/Locality/UpdateLocality.jsx";
import CreatePincode from "./components/admin/Region/Pincode/CreatePincode.jsx";
import UpdatePincode from "./components/admin/Region/Pincode/UpdatePincode.jsx";
import Pincodes from "./components/admin/Region/Pincode/Pincodes.jsx";
import CreateCompany from "./components/admin/Company/CreateCompany.jsx";
import UpdateCompany from "./components/admin/Company/UpdateCompany.jsx";
import Companies from "./components/admin/Company/Companies.jsx";
import CreateBranch from "./components/admin/Branch/CreateBranch.jsx";
import UpdateBranch from "./components/admin/Branch/UpdateBranch.jsx";
import Branches from "./components/admin/Branch/Branches.jsx";
import CreateBranchAdmin from "./components/admin/BranchAdmin/CreateBranchAdmin.jsx";
import UpdateBranchAdmin from "./components/admin/BranchAdmin/UpdateBranchAdmin.jsx";
import BranchAdmins from "./components/admin/BranchAdmin/BranchAdmins.jsx";
import BranchAdminDashboard from "./components/admin/BranchAdminDashboard.jsx";
import Goods from "./components/admin/Goods/Goods.jsx";
import UpdateGoods from "./components/admin/Goods/UpdateGoods.jsx";
import CreateGoods from "./components/admin/Goods/CreateGoods.jsx";
import CreateCustomer from "./components/admin/Customer/CreateCustomer.jsx";
import UpdateCustomer from "./components/admin/Customer/UpdateCustomer.jsx";
import Customers from "./components/admin/Customer/Customers.jsx";
import CreateVehicles from "./components/admin/Vehicle/CreateVehicle.jsx";
import CreateVehicle from "./components/admin/Vehicle/CreateVehicle.jsx";
import UpdateVehicle from "./components/admin/Vehicle/UpdateVehicle.jsx";
import Vehicles from "./components/admin/Vehicle/Vehicles.jsx";
import CreateVendor from "./components/admin/Vendor/CreateVendor.jsx";
import UpdateVendor from "./components/admin/Vendor/UpdateVendor.jsx";
import Vendors from "./components/admin/Vendor/Vendors.jsx";
import OperationUsers from "./components/admin/Operation/OperationUsers.jsx";
import CreateOperationUser from "./components/admin/Operation/CreateOperationUser.jsx";
import UpdateOperationUser from "./components/admin/Operation/UpdateOperationUser.jsx";
import Drivers from "./components/admin/Driver/Drivers.jsx";
import CreateDriver from "./components/admin/Driver/CreateDriver.jsx";
import UpdateDriver from "./components/admin/Driver/UpdateDriver.jsx";
import CreateInvoice from "./components/admin/Invoice/CreateInvoice.jsx";
import Invoices from "./components/admin/Invoice/Invoices.jsx";
import UpdateInvoice from "./components/admin/Invoice/UpdateInvoice.jsx";
import DriverDashboard from "./components/admin/DriverDashboard.jsx";
import AllInvoices from "./components/admin/DriverInvoice/AllInvoices.jsx";
import RecentInvoices from "./components/admin/DriverInvoice/RecentInvoices.jsx";
import UpdateInvoices from "./components/admin/DriverInvoice/UpdateInvoices.jsx";
import CreateSiteType from "./components/admin/SiteType/CreateSiteType.jsx";
import UpdateSiteType from "./components/admin/SiteType/UpdateSiteType.jsx";
import SiteTypes from "./components/admin/SiteType/SiteTypes.jsx";
import CreateTransportMode from "./components/admin/TransportMode/CreateTransportMode.jsx";
import UpdateTransportMode from "./components/admin/TransportMode/UpdateTransportMode.jsx";
import TransportModes from "./components/admin/TransportMode/TransportModes.jsx";
import OperationDashboard from "./components/admin/OperationDashboard.jsx";
import VehicleDetail from "./components/admin/Vehicle/VehicleDetail.jsx";

const appRouter = createBrowserRouter([
  //Homepage Routes
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        path: "",
        element: <Login />,
      },
      {
        path: "",
        element: <Login />,
      },
      {
        path: "verify-otp",
        element: <VerifyOTP />,
      },

      {
        path: "/unauthorized",
        element: <UnAuthorized />,
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },

  //Auth Routes
  // {
  //   path: "/auth",
  //   element: <ContentLayout />,
  //   children: [
  //     {
  //       path: "login",
  //       element: <Login />,
  //     },
  //     {
  //       path: "signup",
  //       element: <Login />,
  //     },
  //     {
  //       path: "verify-otp",
  //       element: <VerifyOTP />,
  //     },
  //   ],
  // },
  
  {
    path: "admin",
    element: (
      <RoleProtectedRoute
        allowedRoles={["superAdmin", "branchAdmin", "operation","driver"]}
      >
        <>
          <Navbar />
          <Sidebar />
          <Footer />
        </>
      </RoleProtectedRoute>
    ),
    children: [
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: "dashboard",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin"]}>
            <Dashboard />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "operation-dashboard",
        element: (
          <RoleProtectedRoute allowedRoles={["operation"]}>
            <OperationDashboard />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "create-company",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin"]}>
            <CreateCompany />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "update-company",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin"]}>
            <UpdateCompany />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "companies",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin"]}>
            <Companies />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "create-branch",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin"]}>
            <CreateBranch />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "update-branch",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin"]}>
            <UpdateBranch />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "branches",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin"]}>
            <Branches />
          </RoleProtectedRoute>
        ),
      },
      //branch admin
      {
        path: "create-branch-admin",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin"]}>
            <CreateBranchAdmin />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "update-branch-admin",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin"]}>
            <UpdateBranchAdmin />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "branch-admins",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin"]}>
            <BranchAdmins />
          </RoleProtectedRoute>
        ),
      },
      //goods
      {
        path: "create-good",
        element: (
          <RoleProtectedRoute
            allowedRoles={["superAdmin", "branchAdmin", "operation"]}
          >
            <CreateGoods />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "update-good",
        element: (
          <RoleProtectedRoute
            allowedRoles={["superAdmin", "branchAdmin", "operation"]}
          >
            <UpdateGoods />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "goods",
        element: (
          <RoleProtectedRoute
            allowedRoles={["superAdmin", "branchAdmin", "operation"]}
          >
            <Goods />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "branch-admin-dashboard",
        element: (
          <RoleProtectedRoute allowedRoles={["branchAdmin"]}>
            <BranchAdminDashboard />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "create-country",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin", "branchAdmin", "operation"]}>
            <CreateCountry />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "update-country",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin", "branchAdmin", "operation"]}>
            <UpdateCountry />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "countries",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin", "branchAdmin", "operation"]}>
            <Countries />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "create-state",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin", "branchAdmin", "operation"]}>
            <CreateState />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "update-state",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin", "branchAdmin", "operation"]}>
            <UpdateState />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "states",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin", "branchAdmin", "operation"]}>
            <States />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "create-city",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin", "branchAdmin", "operation"]}>
            <CreateCity />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "update-city",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin", "branchAdmin", "operation"]}>
            <UpdateCity />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "cities",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin", "branchAdmin", "operation"]}>
            <Cities />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "create-locality",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin", "branchAdmin", "operation"]}>
            <CreateLocality />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "update-locality",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin", "branchAdmin", "operation"]}>
            <UpdateLocality />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "localities",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin", "branchAdmin", "operation"]}>
            <Localities />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "create-pincode",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin", "branchAdmin", "operation"]}>
            <CreatePincode />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "update-pincode",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin", "branchAdmin", "operation"]}>
            <UpdatePincode />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "pincodes",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin", "branchAdmin", "operation"]}>
            <Pincodes />
          </RoleProtectedRoute>
        ),
      },      

      {
        path: "create-customer",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin", "branchAdmin", "operation"]}>
            <CreateCustomer />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "update-customer",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin", "branchAdmin", "operation"]}>
            <UpdateCustomer />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "customers",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin", "branchAdmin", "operation"]}>
            <Customers />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "create-vehicle",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin", "branchAdmin", "operation"]}>
            <CreateVehicle />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "update-vehicle",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin", "branchAdmin", "operation"]}>
            <UpdateVehicle />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "vehicles",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin", "branchAdmin", "operation"]}>
            <Vehicles />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "vehicles/:vehicleId",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin", "branchAdmin", "operation"]}>
            <VehicleDetail />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "create-vendor",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin", "branchAdmin", "operation"]}>
            <CreateVendor />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "update-vendor",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin", "branchAdmin", "operation"]}>
            <UpdateVendor />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "vendors",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin", "branchAdmin", "operation"]}>
            <Vendors />
          </RoleProtectedRoute>
        ),
      },
      
      {
        path: "operation-users",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin", "branchAdmin"]}>
            <OperationUsers />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "create-operation-user",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin", "branchAdmin"]}>
            <CreateOperationUser />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "update-operation-user",
        element: (
          <RoleProtectedRoute allowedRoles={["superAdmin", "branchAdmin"]}>
            <UpdateOperationUser />
          </RoleProtectedRoute>
        ),
      },
      //Driver
      {
        path: "drivers",
        element: (
          <RoleProtectedRoute
            allowedRoles={["superAdmin", "branchAdmin", "operation"]}
          >
            <Drivers />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "create-driver",
        element: (
          <RoleProtectedRoute
            allowedRoles={["superAdmin", "branchAdmin", "operation"]}
          >
            <CreateDriver />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "update-driver",
        element: (
          <RoleProtectedRoute
            allowedRoles={["superAdmin", "branchAdmin", "operation"]}
          >
            <UpdateDriver />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "invoices",
        element: (
          <RoleProtectedRoute
            allowedRoles={["superAdmin", "branchAdmin", "operation"]}
          >
            <Invoices />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "create-invoice",
        element: (
          <RoleProtectedRoute
            allowedRoles={["superAdmin", "branchAdmin", "operation"]}
          >
            <CreateInvoice />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "update-invoice",
        element: (
          <RoleProtectedRoute
            allowedRoles={["superAdmin", "branchAdmin", "operation"]}
          >
            <UpdateInvoice />
          </RoleProtectedRoute>
        ),
      },
      //Driver Dashboard
      {
        path: "driver-dashboard",
        element: (
          <RoleProtectedRoute allowedRoles={["driver"]}>
            <DriverDashboard />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "driver-invoices",
        element: (
          <RoleProtectedRoute allowedRoles={["driver"]}>
            <AllInvoices />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "recent-invoices",
        element: (
          <RoleProtectedRoute allowedRoles={["driver"]}>
            <RecentInvoices />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "update-invoices",
        element: (
          <RoleProtectedRoute allowedRoles={["driver"]}>
            <UpdateInvoices />
          </RoleProtectedRoute>
        ),
      },
      //Site type
      {
        path: "create-site-type",
        element: (
          <RoleProtectedRoute
            allowedRoles={["superAdmin", "branchAdmin", "operation"]}
          >
            <CreateSiteType />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "update-site-type",
        element: (
          <RoleProtectedRoute
            allowedRoles={["superAdmin", "branchAdmin", "operation"]}
          >
            <UpdateSiteType />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "site-types",
        element: (
          <RoleProtectedRoute
            allowedRoles={["superAdmin", "branchAdmin", "operation"]}
          >
            <SiteTypes />
          </RoleProtectedRoute>
        ),
      },
      //Transport Mode
      {
        path: "create-transport-mode",
        element: (
          <RoleProtectedRoute
            allowedRoles={["superAdmin", "branchAdmin", "operation"]}
          >
            <CreateTransportMode />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "update-transport-mode",
        element: (
          <RoleProtectedRoute
            allowedRoles={["superAdmin", "branchAdmin", "operation"]}
          >
            <UpdateTransportMode />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "transport-modes",
        element: (
          <RoleProtectedRoute
            allowedRoles={["superAdmin", "branchAdmin", "operation"]}
          >
            <TransportModes />
          </RoleProtectedRoute>
        ),
      },
    ],
  },
]);

function App() {
  return (
    <main>
      <ThemeProvider>
        <RouterProvider router={appRouter} />
      </ThemeProvider>
    </main>
  );
}

export default App;
