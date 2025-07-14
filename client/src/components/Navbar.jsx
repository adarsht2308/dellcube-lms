import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <header>
      <nav className="m-0 p-0">
        {/* Announcement Bar */}
        <div className="announcement-bar bg-[#292928] text-white">
          <div className="container mx-auto px-4 md:px-10 py-2 flex items-center justify-center text-sm md:text-base">
            <p className="font-semibold text-lg md:text-xl text-center text-[#FFCA00]">
          Dellcube - We Deliver your Trust
            </p>
          </div>
        </div>

        {/* Logo & CTA only */}
        <div className="container mx-auto px-4 md:px-10 py-2 flex justify-center items-center">
          <Link to="/" className="header-logo">
            <img
              src="/images/dellcube_logo-og.png"
              alt="Jai Mata Di Stitching Logo"
              className="w-44 h-auto object-cover"
            />
          </Link>

          {/* <Link to="/" className="custom-btn header-cta">
            Login
          </Link> */}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
