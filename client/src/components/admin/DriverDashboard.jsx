import React, { useEffect, useState } from "react";
import {
  FaClipboardList,
  FaTruckMoving,
  FaCheckCircle,
  FaHourglassHalf,
  FaWeightHanging,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
// Import the correct driver invoice API hook
import { useGetDriverInvoicesQuery } from "@/features/api/DriverInvoice/driverInvoiceApi";

const DriverDashboard = () => {
  const { user } = useSelector((store) => store.auth);
  const driverId = user?._id;
  const navigate = useNavigate();

  // Fetch invoices for this driver
  const { data, isLoading } = useGetDriverInvoicesQuery({ driverId });
  const invoices = data?.invoices || [];

  const stats = [
    {
      title: "Assigned Orders",
      value: invoices.length,
      icon: <FaClipboardList className="text-2xl" />,
      color: "bg-blue-500",
    },
    {
      title: "Completed",
      value: invoices.filter((i) => i.status === "Delivered").length,
      icon: <FaCheckCircle className="text-2xl" />,
      color: "bg-green-500",
    },
    {
      title: "Pending",
      value: invoices.filter((i) => i.status !== "Delivered").length,
      icon: <FaHourglassHalf className="text-2xl" />,
      color: "bg-orange-500",
    },
    {
      title: "Total Weight (Tons)",
      value: invoices.reduce((sum, i) => sum + (i.totalWeight || 0), 0),
      icon: <FaWeightHanging className="text-2xl" />,
      color: "bg-purple-500",
    },
  ];

    return (
      <div className="min-h-screen">
      <main className="container mx-auto md:px-4">
        <div className="mb-8">
          <div className="bg-gradient-to-r from-yellow-100 via-yellow-50 to-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Welcome back, {user?.name || "Driver"}!
                </h2>
                <p className="text-gray-600 mt-1 text-sm md:text-base">
                  Check and manage your assigned deliveries
                </p>
                <div className="mt-4 text-sm text-gray-500">
                  Today: {new Date().toLocaleDateString("en-IN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
              <div className="text-right">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-3xl font-bold mb-2 border border-gray-200">
                  <img
                    src={user?.photoUrl}
                    alt={user?.name}
                    className="w-20 h-20 object-cover rounded-full"
                  />
                </div>
                <p className="text-sm text-gray-500">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isLoading ? (
            Array(4).fill(0).map((_, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-lg border-l-4 border-gray-200 p-6 animate-pulse h-32" />
            ))
          ) : (
            stats.map((s, idx) => (
            <div
              key={idx}
                className={`bg-white rounded-xl shadow-lg border-l-4 ${
                  idx === 0 ? 'border-yellow-400' : // Assigned Orders (gold accent)
                  idx === 1 ? 'border-blue-500' :   // Completed (blue)
                  idx === 2 ? 'border-gray-400' :   // Pending (gray)
                  'border-gray-300'                 // Weight (neutral)
                } p-6 hover:shadow-xl transition-all`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500 text-sm font-medium uppercase">
                    {s.title}
                  </p>
                    <h4 className="font-bold text-3xl mt-1 text-gray-900">
                    {s.value}
                  </h4>
                </div>
                <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg ${
                      idx === 0 ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : // Assigned Orders
                      idx === 1 ? 'bg-blue-50 text-blue-700 border border-blue-200' :      // Completed
                      idx === 2 ? 'bg-gray-50 text-gray-700 border border-gray-200' :      // Pending
                      'bg-gray-50 text-gray-400 border border-gray-200'                    // Weight
                    }`}
                >
                  {s.icon}
                </div>
              </div>
            </div>
            ))
          )}
        </div>
 
        {/* Top 5 Recent Invoices Table */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-12 border border-gray-200 relative z-10">
          <h3 className="text-xl font-bold mb-6 text-gray-900 tracking-wide px-6 py-3 rounded-xl shadow bg-gradient-to-r from-blue-50 to-gray-50 border border-gray-100 inline-block" style={{boxShadow: '0 6px 24px 0 rgba(30,41,59,0.10)'}}>Recent Invoices</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 rounded-xl overflow-hidden border border-gray-100 shadow-md">
              <thead className="bg-gradient-to-r from-blue-50 to-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">Docket No</th>
                  <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">From Address</th>
                  <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">To Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400 text-base font-semibold">Loading...</td>
                  </tr>
                ) : (
                  invoices
                    .slice()
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 5)
                    .map((inv, idx) => (
                      <tr
                        key={inv._id}
                        className={`transition-all duration-150 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50/60`}
                      >
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">{inv.docketNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{inv.customer?.name}</td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold shadow-sm border ${{
                            Delivered: 'bg-blue-100 text-blue-700 border-blue-200',
                            'In Transit': 'bg-gray-100 text-gray-700 border-gray-200',
                            Pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                          }[inv.status] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>{inv.status}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : ''}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {inv.fromAddress?.locality?.name ? inv.fromAddress.locality.name + ', ' : ''}
                          {inv.fromAddress?.city?.name ? inv.fromAddress.city.name + ', ' : ''}
                          {inv.fromAddress?.state?.name ? inv.fromAddress.state.name + ', ' : ''}
                          {inv.fromAddress?.country?.name ? inv.fromAddress.country.name + ', ' : ''}
                          {inv.fromAddress?.pincode?.code || ''}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {inv.toAddress?.locality?.name ? inv.toAddress.locality.name + ', ' : ''}
                          {inv.toAddress?.city?.name ? inv.toAddress.city.name + ', ' : ''}
                          {inv.toAddress?.state?.name ? inv.toAddress.state.name + ', ' : ''}
                          {inv.toAddress?.country?.name ? inv.toAddress.country.name + ', ' : ''}
                          {inv.toAddress?.pincode?.code || ''}
                        </td>
                      </tr>
                    ))
                )}
                {!isLoading && invoices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400 text-base font-semibold">No invoices found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* View All Button */}
          <div className="mt-6 flex justify-end ">
            <button
              onClick={() => navigate('/admin/driver-invoices')}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              View All
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DriverDashboard;
