import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Activity,
  BadgeAlert,
  BadgeCheck,
  Boxes,
  Building,
  Building2,
  Caravan,
  ClipboardList,
  ContactRound,
  Database,
  FilePlus,
  FileText,
  Globe,
  HandCoins,
  Handshake,
  Landmark,
  LayoutDashboard,
  ListOrdered,
  MailWarning,
  Map,
  MapPinned,
  MapPinPlus,
  Package,
  Package2,
  PackageCheck,
  PackageSearch,
  PaletteIcon,
  PersonStandingIcon,
  Plus,
  Quote,
  Receipt,
  ReceiptIndianRupee,
  ReceiptText,
  ShieldHalf,
  Shirt,
  SquareLibrary,
  StarHalf,
  Truck,
  TruckIcon,
  User,
  User2Icon,
  UserCheck,
  Users,
  Warehouse,
  WarehouseIcon,
  ChevronRight,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { PiBuildingOfficeLight, PiCityLight } from "react-icons/pi";
import { useSelector } from "react-redux";
import { selectUserRole } from "@/features/authSlice";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useLoadUserQuery } from "@/features/api/authApi";  

const DELLCUBE_COLORS = {
  gold: "#FFD249",
  dark: "#202020",
  gray: "#828083",
};

const Sidebar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState("");
  const [activeAccordion, setActiveAccordion] = useState("");
  const { data, isLoading, refetch } = useLoadUserQuery();
  const user = data && data.user;
  const location = useLocation();

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const menuItems = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: LayoutDashboard,
      path:
        user?.role === "superAdmin" || user?.role === "vendor"
          ? "/admin/dashboard"
          : user?.role === "driver"
          ? "/admin/driver-dashboard"
          : user?.role === "operation"
          ? "/admin/operation-dashboard"
          : "/admin/branch-admin-dashboard",
      roles: ["superAdmin", "branchAdmin", "operation", "driver", "vendor"],
    },
    // {
    //   id: "regions",
    //   title: "Regions",
    //   icon: ContactRound,
    //   roles: ["superAdmin", "branchAdmin", "operation"],
    //   subItems: [
    //     { title: "Countries", icon: Globe, path: "/admin/countries" },
    //     { title: "States", icon: Map, path: "/admin/states" },
    //     { title: "Cities", icon: Building2, path: "/admin/cities" },
    //     { title: "Localities", icon: MapPinned, path: "/admin/localities" },
    //     { title: "Pincodes", icon: MapPinPlus, path: "/admin/pincodes" },
    //   ],
    // },
    {
      id: "company",
      title: "Company Management",
      icon: Building,
      roles: ["superAdmin"],
      subItems: [
        {
          title: "Companies",
          icon: PiBuildingOfficeLight,
          path: "/admin/companies",
        },
        { title: "Branches", icon: WarehouseIcon, path: "/admin/branches" },
      ],
    },
    {
      id: "users",
      title: "User Management",
      icon: User,
      roles: ["superAdmin", "branchAdmin", "operation", "vendor"],
      subItems: [
        ...(user?.role === "superAdmin"
          ? [
              {
                title: "Branch Admins",
                icon: UserCheck,
                path: "/admin/branch-admins",
              },
            ]
          : []),
        ...(user?.role === "superAdmin" || user?.role === "branchAdmin"
          ? [
              {
                title: "Operations",
                icon: ShieldHalf,
                path: "/admin/operation-users",
              },
            ]
          : []),
        { title: "Drivers", icon: Truck, path: "/admin/drivers" },
      ],
    },
    {
      id: "master",
      title: "Master Data",
      icon: PackageSearch,
      roles: ["superAdmin", "branchAdmin", "operation", "vendor"],
      subItems: [
        ...(user?.role === "vendor"
          ? [
            
              {
                title: "Vehicles",
                icon: Truck,
                path: "/admin/vendor-vehicles",
              },
              { title: "Customers", icon: Users, path: "/admin/customers" },
            ]
          : [
            { title: "Customers", icon: Users, path: "/admin/customers" },
            { title: "Vendors", icon: Handshake, path: "/admin/vendors" },
              { title: "Vehicles", icon: Truck, path: "/admin/vehicles" },
              { title: "Goods", icon: Boxes, path: "/admin/goods" },
              { title: "Site Types", icon: Caravan, path: "/admin/site-types" },
              {
                title: "Transport Modes",
                icon: Truck,
                path: "/admin/transport-modes",
              },
            ]),
      ],
    },
    {
      id: "operations",
      title: "Operations",
      icon: ClipboardList,
      roles: ["superAdmin", "branchAdmin", "operation", "vendor"],
      subItems: [
        {
          title: user?.role === "vendor" ? "Customer Invoices" : "Dockets",
          icon: FileText,
          path:
            user?.role === "vendor"
              ? "/admin/vendor-invoices"
              : "/admin/invoices",
        },
      ],
    },
    {
      id: "activities",
      title: "Activity Log",
      icon: Activity,
      path: "/admin/activities",
      roles: ["superAdmin", "branchAdmin"],
    },
    {
      id: "create-order",
      title: "Create Order",
      icon: Plus,
      path: "/admin/create-invoice",
      roles: ["superAdmin", "branchAdmin", "operation"],
      isButton: true,
    },
    {
      id: "driver-orders",
      title: "Assigned Orders",
      icon: ContactRound,
      roles: ["driver"],
      subItems: [
        { title: "Recent Orders", icon: Globe, path: "/admin/recent-invoices" },
        { title: "All Orders", icon: Map, path: "/admin/driver-invoices" },
      ],
    },
    {
      id: "vendor-profile",
      title: "My Profile",
      icon: User,
      path: "/admin/vendor-profile",
      roles: ["vendor"],
    },
    
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  return (
    <>
      <style>{`
        .sidebar-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #FFD249 rgba(255, 210, 73, 0.25);
          overflow-y: auto !important;
        }
        .sidebar-scrollbar::-webkit-scrollbar {
          width: 8px;
          -webkit-appearance: none;
        }
        .sidebar-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 210, 73, 0.2);
          border-radius: 10px;
          margin: 4px 0;
        }
        .sidebar-scrollbar::-webkit-scrollbar-thumb {
          background: #FFD249;
          border-radius: 10px;
          border: 1px solid rgba(255, 210, 73, 0.4);
          min-height: 30px;
          transition: background 0.2s ease, border 0.2s ease;
        }
        .sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #FFCA00;
          border: 1px solid rgba(255, 210, 73, 0.6);
        }
        .sidebar-scrollbar::-webkit-scrollbar-thumb:active {
          background: #e6b800;
          border: 1px solid rgba(255, 210, 73, 0.8);
        }
        .sidebar-scrollbar::-webkit-scrollbar-corner {
          background: transparent;
        }
      `}</style>
    <div className="pt-14 min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="flex w-full">
      <div className="lg:hidden fixed top-16 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-sm border-[#FFD249]/30 hover:bg-[#FFD249]/10"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          <span className="ml-2">Menu</span>
        </Button>
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div
        className={`${
          isMobileMenuOpen ? "block" : "hidden"
        } lg:block fixed top-14 left-0 h-[calc(100vh-56px)] w-[280px] z-50 bg-gradient-to-br from-yellow-50 via-white to-yellow-100 shadow-xl border-r border-[#FFD249]/30 transition-all duration-300 flex flex-col overflow-hidden`}
      >
        <div className="p-6 border-b border-[#FFD249]/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 lex items-center justify-center  ">
              <img
                src="/images/dellcube-favicon.png"
                alt="DellCube"
                className="w-10 h-10"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#202020]">
                DellCube's LMS
              </h1>
              <p className="text-xs text-[#828083] font-medium tracking-wide">
                Operations Hub
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#FFD249]/10 to-[#FFD249]/5 rounded-2xl p-4 border border-[#FFD249]/20">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 ring-2 ring-[#FFD249]/30">
                <AvatarImage src={user?.photoUrl} alt={user?.name} />
                <AvatarFallback className="bg-[#FFD249] text-[#202020] font-semibold">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#202020] truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-[#828083] capitalize">
                  {user?.role?.replace(/([A-Z])/g, " $1").trim() || "Role"}
                </p>
                <p className="text-xs text-[#828083] mt-1">{getGreeting()}</p>
              </div>
              <div className="flex flex-col gap-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    user?.status === true ? "bg-green-400" : "bg-gray-400"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto py-4 px-4 space-y-3 sidebar-scrollbar"
          style={{ scrollBehavior: "smooth" }}
        >
          <div className="sticky top-0 bg-gradient-to-b from-yellow-50/80 via-white to-transparent py-2 z-10">
            <p className="text-xs font-semibold text-[#b58b00] tracking-[0.2em] uppercase">
              Navigation
            </p>
          </div>
          <div className="space-y-2">
            {filteredMenuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = isActiveRoute(item.path);

              if (item.isButton) {
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className="block w-full mb-3"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="bg-gradient-to-r from-[#FFD249] to-[#FFCA00] rounded-lg p-2 shadow group hover:shadow-md transition-all duration-200 flex items-center gap-2 text-gray-900 justify-center">
                      <IconComponent
                        size={18}
                        className="group-hover:scale-105 transition-transform"
                      />
                      <span className="font-semibold text-sm">
                        {item.title}
                      </span>
                    </div>
                  </Link>
                );
              }

              if (item.subItems) {
                return (
                  <Accordion
                    key={item.id}
                    type="single"
                    collapsible
                    value={openAccordion === item.id ? item.id : ""}
                    onValueChange={(value) =>
                      setOpenAccordion(value ? item.id : "")
                    }
                    className="w-full"
                  >
                    <AccordionItem value={item.id} className="border-none">
                      <AccordionTrigger className="hover:no-underline py-2 px-3 rounded-lg hover:bg-[#FFD249]/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <IconComponent size={20} className="text-[#828083]" />
                          <span className="text-sm font-medium text-[#202020]">
                            {item.title}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        <div className="pl-4 space-y-1">
                          {item.subItems.map((subItem, index) => {
                            const SubIconComponent = subItem.icon;
                            const isSubActive = isActiveRoute(subItem.path);
                            return (
                              <Link
                                key={index}
                                to={subItem.path}
                                className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-200 group ${
                                  isSubActive
                                    ? "bg-[#FFD249]/20 text-[#202020] shadow-sm"
                                    : "hover:bg-[#FFD249]/10 text-[#828083] hover:text-[#202020]"
                                }`}
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                <SubIconComponent
                                  size={18}
                                  className="group-hover:scale-110 transition-transform"
                                />
                                <span className="text-sm font-medium">
                                  {subItem.title}
                                </span>
                                {isSubActive && (
                                  <div className="w-2 h-2 bg-[#FFD249] rounded-full ml-auto" />
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                );
              }

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center gap-3 py-3 px-3 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? "bg-[#FFD249]/20 text-[#202020] shadow-sm"
                      : "hover:bg-[#FFD249]/10 text-[#828083] hover:text-[#202020]"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <IconComponent
                    size={20}
                    className="group-hover:scale-110 transition-transform"
                  />
                  <span className="text-sm font-medium">{item.title}</span>
                  {isActive && (
                    <div className="w-2 h-2 bg-[#FFD249] rounded-full ml-auto" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-screen w-full min-w-0 bg-gradient-to-br from-gray-50 to-white lg:ml-[280px] pt-16">
        <div className="w-full px-4 lg:px-8">
          <Outlet />
        </div>
      </div>
      </div>
    </div>
    </>
  );
};

export default Sidebar;
