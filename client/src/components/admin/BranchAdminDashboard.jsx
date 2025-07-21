import React from "react";
import {
  FaUsers,
  FaTruck,
  FaClipboardList,
  FaUserTie,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { useGetAllDriversQuery } from "@/features/api/authApi";
import { useGetAllVehiclesQuery } from "@/features/api/Vehicle/vehicleApi";
import { useGetAllInvoicesQuery } from "@/features/api/Invoice/invoiceApi";
import { useGetAllCustomersQuery } from "@/features/api/Customer/customerApi";

const BranchAdminDashboard = () => {
  const { user } = useSelector((store) => store.auth);
  const branchId = user?.branch?._id || "";
  const companyId = user?.company?._id || "";

  // Fetch data filtered by branch/company
  const { data: driversData, isLoading: loadingDrivers } = useGetAllDriversQuery({ page: 1, limit: 100, search: "", branch: branchId, company: companyId });
  const { data: vehiclesData, isLoading: loadingVehicles } = useGetAllVehiclesQuery({ page: 1, limit: 100, search: "", branch: branchId, company: companyId });
  const { data: invoicesData, isLoading: loadingInvoices } = useGetAllInvoicesQuery({ page: 1, limit: 100, search: "", branch: branchId, company: companyId });
  const { data: customersData, isLoading: loadingCustomers } = useGetAllCustomersQuery({ page: 1, limit: 100, search: "", branchId, companyId });

  const stats = [
    {
      title: "Branch Customers",
      value: loadingCustomers ? "..." : customersData?.customers?.length || 0,
      icon: <FaUsers className="text-2xl" />, 
      color: "bg-blue-500",
    },
    {
      title: "Branch Vehicles",
      value: loadingVehicles ? "..." : vehiclesData?.vehicles?.length || 0,
      icon: <FaTruck className="text-2xl" />, 
      color: "bg-green-500",
    },
    {
      title: "Branch Drivers",
      value: loadingDrivers ? "..." : driversData?.drivers?.length || 0,
      icon: <FaUserTie className="text-2xl" />, 
      color: "bg-orange-500",
    },
    {
      title: "Active Dockets",
      value: loadingInvoices ? "..." : invoicesData?.invoices?.filter(inv => inv.status === "active").length || 0,
      icon: <FaClipboardList className="text-2xl" />, 
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="min-h-screen">
      <main className="container mx-auto md:px-4">
          <div className="mb-8">
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">
                  Welcome back, {user?.name || "User"}!
                </h2>
                <p className="text-orange-100 mt-1 text-sm md:text-base">
                  Manage all Dellcube branches, staff, and logistics operations
                </p>
                <div className="mt-4 text-sm text-orange-100">
                  Today:{" "}
                  {new Date().toLocaleDateString("en-IN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
              <div className="text-right">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold mb-2">
                  <img
                    src={user?.photoUrl}
                    alt={user?.name}
                    className="w-20 h-20   object-cover rounded-full"
                  />
                </div>
                <p className="text-sm text-orange-100">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((s, idx) => (
            <div
              key={idx}
              className={`bg-white rounded-xl shadow-lg border-l-4 ${s.color} p-6 hover:shadow-xl transition-all`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500 text-sm font-medium uppercase">
                    {s.title}
                  </p>
                  <h4 className="font-bold text-3xl mt-1 text-gray-800">
                    {s.value}
                  </h4>
                </div>
                <div
                  className={`w-14 h-14 rounded-xl ${s.color} text-white flex items-center justify-center shadow-lg`}
                >
                  {s.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Shortcuts */}
        <div className="flex flex-wrap gap-4 mb-8">
          <a
            href="/admin/create-customer"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FaUsers className="mr-2" /> Add Customer
          </a>
          <a
            href="/admin/create-driver"
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            <FaUserTie className="mr-2" /> Add Driver
          </a>
          <a
            href="/admin/create-vehicle"
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <FaTruck className="mr-2" /> Add Vehicle
          </a>
          <a
            href="/admin/invoices"
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <FaClipboardList className="mr-2" /> View Invoices
          </a>
        </div>
       
      {/* Latest Tables Section */}
      <main className="container mx-auto md:px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Latest Dockets */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FaClipboardList className="mr-2 text-blue-600" />
                  Latest Dockets
                </h3>
                <a
                  href="/admin/dockets"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View All
                </a>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Docket No</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">From</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">To</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loadingInvoices ? (
                    <tr><td colSpan="5" className="text-center py-4">Loading...</td></tr>
                  ) : invoicesData?.invoices?.length ? (
                    invoicesData.invoices.slice(0, 5).map((inv) => (
                      <tr key={inv._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-blue-600">{inv.docketNumber}</td>
                        <td className="px-4 py-3">{inv.fromAddress?.city?.name || "-"}</td>
                        <td className="px-4 py-3">{inv.toAddress?.city?.name || "-"}</td>
                        <td className="px-4 py-3">{inv.customer?.name || "-"}</td>
                        <td className="px-4 py-3 text-green-600 font-medium">{inv.status || "-"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="text-center py-4">No dockets found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Latest Vehicles */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FaTruck className="mr-2 text-green-600" />
                  Latest Vehicles
                </h3>
                <a
                  href="/admin/vehicles"
                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                >
                  View All
                </a>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Vehicle No.</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Brand</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loadingVehicles ? (
                    <tr><td colSpan="3" className="text-center py-4">Loading...</td></tr>
                  ) : vehiclesData?.vehicles?.length ? (
                    vehiclesData.vehicles.slice(0, 5).map((veh) => (
                      <tr key={veh._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{veh.vehicleNumber}</td>
                        <td className="px-4 py-3">{veh.type}</td>
                        <td className="px-4 py-3">{veh?.brand || "Dellcube Logistics PVT LTD"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="3" className="text-center py-4">No vehicles found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Latest Drivers */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200 bg-orange-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FaUserTie className="mr-2 text-orange-600" />
                  Latest Drivers
                </h3>
                <a
                  href="/admin/drivers"
                  className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                >
                  View All
                </a>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">License</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loadingDrivers ? (
                    <tr><td colSpan="3" className="text-center py-4">Loading...</td></tr>
                  ) : driversData?.drivers?.length ? (
                    driversData.drivers.slice(0, 5).map((driver) => (
                      <tr key={driver._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{driver.name}</td>
                        <td className="px-4 py-3">{driver.phone || "-"}</td>
                        <td className="px-4 py-3">{driver.licenseNumber || "-"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="3" className="text-center py-4">No drivers found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Latest Customers */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FaUsers className="mr-2 text-blue-600" />
                  Latest Customers
                </h3>
                <a
                  href="/admin/customers"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View All
                </a>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Address</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loadingCustomers ? (
                    <tr><td colSpan="3" className="text-center py-4">Loading...</td></tr>
                  ) : customersData?.customers?.length ? (
                    customersData.customers.slice(0, 5).map((customer) => (
                      <tr key={customer._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{customer.name}</td>
                        <td className="px-4 py-3">{customer.phone || "-"}</td>
                        <td className="px-4 py-3">{customer.address || "-"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="3" className="text-center py-4">No customers found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      </main>
    </div>
  );
};

export default BranchAdminDashboard;
