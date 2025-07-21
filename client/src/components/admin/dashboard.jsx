import { useGetAllBranchesQuery } from "@/features/api/Branch/branchApi";
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi";
import { Truck, User2 } from "lucide-react";
import React from "react";
import {
  FaBuilding,
  FaUserShield,
  FaUsers,
  FaTruck,
  FaRoute,
  FaMapMarkerAlt,
  FaUserTie,
  FaClipboardList,
  FaPlus,
  FaShoppingBag,
  FaUser,
  FaSitemap,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { useGetAllDriversQuery } from "@/features/api/authApi";
import { useGetAllVehiclesQuery } from "@/features/api/Vehicle/vehicleApi";
import { useGetAllInvoicesQuery } from "@/features/api/Invoice/invoiceApi";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from "recharts";

const SuperAdminDashboard = () => {
  const { user } = useSelector((store) => store.auth);
  
  // Get current month's date range
  const now = new Date();
  const fromDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const { data: branchData, isLoading: loadingBranches } =
    useGetAllBranchesQuery({ page: 1, limit: "", search: "" });
  const { data: companyData, isLoading: loadingCompanies } =
    useGetAllCompaniesQuery({ page: 1, limit: "", search: "" });
  // Add hooks for dynamic data
  const { data: driversData, isLoading: loadingDrivers } =
    useGetAllDriversQuery({ page: 1, limit: 100, search: "" });
  const { data: vehiclesData, isLoading: loadingVehicles } =
    useGetAllVehiclesQuery({ page: 1, limit: 100, search: "" });
  const { data: invoicesData, isLoading: loadingInvoices } =
    useGetAllInvoicesQuery({ page: 1, limit: 100, search: "", fromDate, toDate });

  // Business stats calculations for the current month
  const totalRevenue =
    invoicesData?.invoices?.reduce(
      (sum, inv) => sum + (inv.freightCharges || 0),
      0
    ) || 0;
  const totalWeight =
    invoicesData?.invoices?.reduce(
      (sum, inv) => sum + (inv.totalWeight || 0),
      0
    ) || 0;
  const uniqueCustomers = invoicesData?.invoices
    ? new Set(
        invoicesData.invoices.map((inv) => inv.customer?._id).filter(Boolean)
      ).size
    : 0;
  const activeVehicles =
    vehiclesData?.vehicles?.filter((v) => v.status === "active").length || 0;
  const experiencedDrivers = driversData?.drivers?.length || 0;

  const stats = [
    {
      title: "Total Branches",
      value: loadingBranches ? "..." : branchData?.total || 0,
      icon: <FaBuilding className="text-2xl" />,
      color: "bg-blue-500",
    },
    {
      title: "Total Companies",
      value: loadingCompanies ? "..." : companyData?.total || 0,
      icon: <FaUsers className="text-2xl" />,
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="min-h-screen ">
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

        {/* Stats Cards */}
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
          {/* Additional business stats */}
          <div className="bg-white rounded-xl shadow-lg border-l-4 border-green-500 p-6 hover:shadow-xl transition-all">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm font-medium uppercase">
                  This Month's Freight
                </p>
                <h4 className="font-bold text-3xl mt-1 text-gray-800">
                  ₹{totalRevenue.toLocaleString()}
                </h4>
              </div>
              <div className="w-14 h-14 rounded-xl bg-green-500 text-white flex items-center justify-center shadow-lg">
                <FaClipboardList className="text-2xl" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg border-l-4 border-orange-500 p-6 hover:shadow-xl transition-all">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm font-medium uppercase">
                  This Month's Weight
                </p>
                <h4 className="font-bold text-3xl mt-1 text-gray-800">
                  {totalWeight} kg
                </h4>
              </div>
              <div className="w-14 h-14 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-lg">
                <FaShoppingBag className="text-2xl" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg border-l-4 border-pink-500 p-6 hover:shadow-xl transition-all">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm font-medium uppercase">
                  Unique Customers
                </p>
                <h4 className="font-bold text-3xl mt-1 text-gray-800">
                  {uniqueCustomers}
                </h4>
              </div>
              <div className="w-14 h-14 rounded-xl bg-pink-500 text-white flex items-center justify-center shadow-lg">
                <FaUser className="text-2xl" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg border-l-4 border-blue-500 p-6 hover:shadow-xl transition-all">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm font-medium uppercase">
                  Active Vehicles
                </p>
                <h4 className="font-bold text-3xl mt-1 text-gray-800">
                  {activeVehicles}
                </h4>
              </div>
              <div className="w-14 h-14 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg">
                <FaTruck className="text-2xl" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg border-l-4 border-purple-500 p-6 hover:shadow-xl transition-all">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm font-medium uppercase">
                  Experienced Drivers
                </p>
                <h4 className="font-bold text-3xl mt-1 text-gray-800">
                  {experiencedDrivers}
                </h4>
              </div>
              <div className="w-14 h-14 rounded-xl bg-purple-500 text-white flex items-center justify-center shadow-lg">
                <FaUserTie className="text-2xl" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          <a
            href="/admin/create-branch"
            className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            <FaPlus className="mr-2" /> Add Branch
          </a>
          <a
            href="/admin/create-customer"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FaPlus className="mr-2" /> Add Customer
          </a>
          <a
            href="/admin/create-vehicle"
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <FaPlus className="mr-2" /> Add Vehicle
          </a>
          <a
            href="/admin/create-vendor"
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Truck className="mr-2" /> Add Vendor
          </a>
          <a
            href="/admin/create-driver"
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            <FaPlus className="mr-2" /> Add Driver
          </a>

          <a
            href="/admin/create-customer"
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <User2 className="mr-2" /> Add Customers
          </a>
        </div>

        {/* <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8"> */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <FaShoppingBag className="mr-2 text-blue-600" />
                Latest Dockets
              </h3>
              <a
                href="/admin/invoices"
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
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                    Docket No
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                    From
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                    To
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                    Company
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loadingInvoices ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      Loading...
                    </td>
                  </tr>
                ) : invoicesData?.invoices?.length ? (
                  invoicesData.invoices.slice(0, 5).map((inv) => (
                    <tr key={inv._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-blue-600">
                        {inv.docketNumber}
                      </td>
                      <td className="px-4 py-3">
                        {inv.fromAddress?.city?.name || "-"}
                      </td>
                      <td className="px-4 py-3">
                        {inv.toAddress?.city?.name || "-"}
                      </td>
                      <td className="px-4 py-3">{inv.customer?.name || "-"}</td>
                      <td className="px-4 py-3">{inv.company?.name || "-"}</td>
                      <td className="px-4 py-3 text-green-600 font-medium">
                        {inv.status || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      No dockets found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {/* Latest Companies */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200 bg-purple-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FaBuilding className="mr-2 text-purple-600" />
                  Latest Companies
                </h3>
                <a
                  href="/admin/companies"
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                >
                  View All
                </a>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                      Name
                    </th>

                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                      Address
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {companyData?.companies?.slice(0, 5).map((company) => (
                    <tr key={company._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{company.name}</td>
                      <td className="px-4 py-3">
                        {company.contactPhone || "N/A"}
                      </td>
                      <td className="px-4 py-3">{company.address || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Latest Branches */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FaSitemap className="mr-2 text-blue-600" />
                  Latest Branches
                </h3>
                <a
                  href="/admin/branches"
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
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                      Company
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                      Location
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {branchData?.branches?.slice(0, 5).map((branch) => (
                    <tr key={branch._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{branch.name}</td>
                      <td className="px-4 py-3">
                        {branch.company?.name || "N/A"}
                      </td>
                      <td className="px-4 py-3">{branch.name || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-yellow-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <FaTruck className="mr-2 text-yellow-600" />
                Latest Vehicles Added
              </h3>
              <a
                href="/admin/vehicles"
                className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
              >
                View All
              </a>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                    Vehicle No.
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                    Branch
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">
                    Brand
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loadingVehicles ? (
                  <tr>
                    <td colSpan="4" className="text-center py-4">
                      Loading...
                    </td>
                  </tr>
                ) : vehiclesData?.vehicles?.length ? (
                  vehiclesData.vehicles.slice(0, 5).map((veh) => (
                    <tr key={veh._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{veh.vehicleNumber}</td>
                      <td className="px-4 py-3">{veh.type}</td>
                      <td className="px-4 py-3">{veh.branch?.name || "-"}</td>
                      <td className="px-4 py-3">
                        {veh?.brand || "Dellcube Logistics PVT LTD"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-4">
                      No vehicles found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* PieChart: Payment Type Distribution */}
          <div className="bg-white rounded-xl shadow-lg p-4 flex flex-col items-center">
            <h3 className="text-lg font-semibold mb-2">
              Payment Type Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={(() => {
                    const counts = { Prepaid: 0, "To-Pay": 0, Other: 0 };
                    invoicesData?.invoices?.forEach((inv) => {
                      if (inv.paymentType === "Prepaid") counts.Prepaid++;
                      else if (inv.paymentType === "To-Pay") counts["To-Pay"]++;
                      else counts.Other++;
                    });
                    return [
                      { name: "Prepaid", value: counts.Prepaid },
                      { name: "To-Pay", value: counts["To-Pay"] },
                      { name: "Other", value: counts.Other },
                    ];
                  })()}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  <Cell key="Prepaid" fill="#FFD249" />
                  <Cell key="To-Pay" fill="#36B37E" />
                  <Cell key="Other" fill="#FF7043" />
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* BarChart: Top 5 Customers by Freight Charges */}
          <div className="bg-white rounded-xl shadow-lg p-4 flex flex-col items-center">
            <h3 className="text-lg font-semibold mb-2">
              Top 5 Customers by Freight Charges
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={(() => {
                  const customerMap = {};
                  invoicesData?.invoices?.forEach((inv) => {
                    if (inv.customer?.name) {
                      customerMap[inv.customer.name] =
                        (customerMap[inv.customer.name] || 0) +
                        (inv.freightCharges || 0);
                    }
                  });
                  return Object.entries(customerMap)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5);
                })()}
                margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <RechartsTooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="value" fill="#FFD249" name="Freight Charges" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
