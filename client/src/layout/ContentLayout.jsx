import Footer from "@/components/admin/Footer";
import Navbar from "@/components/admin/Navbar.jsx";
import Sidebar from "@/components/admin/sidebar";
import React from "react";
import { Outlet } from "react-router-dom";

const ContentLayout = () => {
  return (
    <>
      <Navbar />
      <div>
        <Outlet></Outlet>
      </div>
      <Footer />
    </>
  );
};

export default ContentLayout;
