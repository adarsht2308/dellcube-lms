import { 
  Calculator, 
  Clock, 
  LogOut, 
  Menu, 
  School, 
  Bell, 
  Search,
  Package,
  Truck,
  MapPin,
  Activity,
  Settings,
  User,
  ChevronDown,
  X,
  Home,
  BarChart3,
  Shield
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DarkMode from "../DarkMode";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { Link, useNavigate } from "react-router-dom";
import {
  useLoadUserQuery,
  useLogoutUserMutation,
} from "../../features/api/authApi";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { Dialog, DialogContent, DialogTrigger } from "@radix-ui/react-dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { format } from "date-fns";

const DELLCUBE_COLORS = {
  gold: '#FFD249',
  dark: '#202020',
  gray: '#828083',
};

const Navbar = () => {
  const { user } = useSelector((store) => store.auth);
  const [logoutUser, { data, isLoading, isSuccess }] = useLogoutUserMutation();
  const navigate = useNavigate();

  const logoutHandler = async () => {
    await logoutUser();
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data.message || "User Logged Out");
      navigate("/");
    }
  }, [isSuccess]);

  const [currentTime, setCurrentTime] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(format(now, "hh:mm:ss a"));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getStatusColor = (role) => {
    switch (role) {
      case 'superAdmin': return 'bg-red-500';
      case 'branchAdmin': return 'bg-blue-500';
      case 'operation': return 'bg-green-500';
      case 'driver': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'superAdmin': return 'Super Admin';
      case 'branchAdmin': return 'Branch Admin';
      case 'operation': return 'Operations';
      case 'driver': return 'Driver';
      default: return 'User';
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-xl border-b border-[#FFD249]/20 fixed top-0 left-0 right-0 z-50 shadow-sm">
      {/* Desktop Navbar */}
      <div className="container mx-auto px-4 md:px-10 py-0 hidden md:flex justify-between items-center h-14">
        
        {/* Left Section - Time & Quick Actions */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-[#828083] bg-[#FFD249]/5 px-3 py-1.5 rounded-full border border-[#FFD249]/20">
            <Clock size={16} className="text-[#FFD249]" />
            <span className="text-sm font-medium">{currentTime}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-[#828083]">
              <Activity size={14} className="text-green-500" />
              <span>System Active</span>
            </div>
          </div>
        </div>

        {/* Center Section - Logo & Search */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center justify-center group">
            <img
              src="/images/dellcube_logo-og.png"
              alt="Dellcube logo"
              className="w-40 h-auto object-contain group-hover:scale-105 transition-transform duration-200"
            />
          </Link>
          
         
        </div>

        {/* Right Section - User Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
            
              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-3 cursor-pointer hover:bg-[#FFD249]/10 p-2 rounded-lg transition-colors">
                    <div className="relative">
                      <Avatar className="w-9 h-9 ring-2 ring-[#FFD249]/30">
                        <AvatarImage src={user?.photoUrl} alt={user?.name} />
                        <AvatarFallback className="bg-[#FFD249] text-[#202020] font-semibold text-sm">
                          {user?.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(user?.role)}`} />
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-medium text-[#202020]">{user?.name}</p>
                      <p className="text-xs text-[#828083]">{getRoleLabel(user?.role)}</p>
                    </div>
                    <ChevronDown size={14} className="text-[#828083] hidden lg:block" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 mr-4">
                  <DropdownMenuLabel className="pb-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user?.photoUrl} alt={user?.name} />
                        <AvatarFallback className="bg-[#FFD249] text-[#202020] font-semibold">
                          {user?.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user?.name}</p>
                        <p className="text-xs text-[#828083]">{getGreeting()}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {getRoleLabel(user?.role)}
                        </Badge>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link to="profile" className="cursor-pointer">
                        <User size={16} className="mr-2" />
                        Edit Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={
                        user?.role === "superAdmin" 
                          ? "/admin/dashboard"
                          : user?.role === "driver"
                          ? "/admin/driver-dashboard"
                          : user?.role === "operation"
                          ? "/admin/operation-dashboard"
                          : "/admin/branch-admin-dashboard"
                      } className="cursor-pointer">
                        <BarChart3 size={16} className="mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logoutHandler} className="text-red-600 focus:text-red-600">
                    <LogOut size={16} className="mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex gap-2 items-center">
              <Link to="/">
                <Button variant="outline" className="border-[#FFD249] text-[#FFD249] hover:bg-[#FFD249] hover:text-[#202020]">
                  Login
                </Button>
              </Link>
            </div>
          )}
          
          {/* <DarkMode /> */}
        </div>
      </div>

      {/* Mobile Navbar */}
      <div className="flex md:hidden justify-between items-center px-4 py-2 h-14">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[#828083]">
            <Clock size={16} className="text-[#FFD249]" />
            <span className="text-xs font-medium">{format(new Date(), "HH:mm")}</span>
          </div>
        </div>

        <Link to="/" className="flex justify-center">
          <img
            src="/images/dellcube_logo-og.png"
            alt="DellCube Logo"
            className="w-24 h-auto object-contain"
          />
        </Link>

        <MobileNavbar />
      </div>
    </div>
  );
};

export default Navbar;

const MobileNavbar = () => {
  const { user } = useSelector((store) => store.auth);
  const [logoutUser, { data, isLoading, isSuccess }] = useLogoutUserMutation();
  const navigate = useNavigate();

  const logoutHandler = async () => {
    await logoutUser();
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data.message || "User Logged Out");
      navigate("/");
    }
  }, [isSuccess]);

  const getRoleLabel = (role) => {
    switch (role) {
      case 'superAdmin': return 'Super Admin';
      case 'branchAdmin': return 'Branch Admin';
      case 'operation': return 'Operations';
      case 'driver': return 'Driver';
      default: return 'User';
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="rounded-full hover:bg-[#FFD249]/10 border-[#FFD249]/20"
          variant="outline"
        >
          <Menu size={18} />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col bg-gradient-to-br from-white via-[#FFF8E1]/30 to-[#FFD249]/5 w-80">
        <SheetHeader className="flex flex-row items-center justify-between mt-2 pb-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center">
            <img src="/images/dellcube-favicon.png" alt="DellCube" className="w-10 h-10" />            </div>
            <div>
              <h2 className="font-bold text-[#202020]">DellCube</h2>
              <p className="text-xs text-[#828083]">Operation Hub</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {/* <DarkMode />
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X size={16} />
              </Button>
            </SheetClose> */}
          </div>
        </SheetHeader>
        
        <Separator className="mb-4" />
        
        {user ? (
          <div className="flex flex-col gap-4 flex-1">
            {/* User Profile Section */}
            <div className="bg-gradient-to-r from-[#FFD249]/10 to-[#FFD249]/5 rounded-2xl p-4 border border-[#FFD249]/20">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-12 h-12 ring-2 ring-[#FFD249]/30">
                  <AvatarImage src={user?.photoUrl} alt={user?.name} />
                  <AvatarFallback className="bg-[#FFD249] text-[#202020] font-semibold">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-[#202020]">{user?.name}</p>
                  <Badge variant="outline" className="text-xs">
                    {getRoleLabel(user?.role)}
                  </Badge>
                </div>
              </div>
              
              {/* Quick Stats */}
             
            </div>

            {/* Navigation Links */}
            <div className="space-y-2">
              <Link 
                to={
                  user?.role === "superAdmin" 
                    ? "/admin/dashboard"
                    : user?.role === "driver"
                    ? "/admin/driver-dashboard"
                    : user?.role === "operation"
                    ? "/admin/operation-dashboard"
                    : "/admin/branch-admin-dashboard"
                }
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#FFD249]/10 transition-colors"
              >
                <BarChart3 size={18} className="text-[#828083]" />
                <span className="font-medium">Dashboard</span>
              </Link>
              
              <Link 
                to="/admin/profile"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#FFD249]/10 transition-colors"
              >
                <User size={18} className="text-[#828083]" />
                <span className="font-medium">Edit Profile</span>
              </Link>
              
              <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#FFD249]/10 transition-colors w-full text-left">
                <Settings size={18} className="text-[#828083]" />
                <span className="font-medium">Settings</span>
              </button>
            </div>

            {/* Logout Button */}
            <div className="mt-auto">
              <Separator className="mb-4" />
              <button
                onClick={logoutHandler}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 transition-colors w-full text-left text-red-600"
              >
                <LogOut size={18} />
                <span className="font-medium">Log out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 items-center justify-center flex-1">
            <div className="text-center mb-4">
              <h3 className="font-semibold text-[#202020] mb-2">Welcome to DellCube</h3>
              <p className="text-sm text-[#828083]">Please log in to access your dashboard</p>
            </div>
            <Link to="/" className="w-full">
              <Button className="w-full bg-[#FFD249] hover:bg-[#FFCA00] text-[#202020] font-semibold">
                Login
              </Button>
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};