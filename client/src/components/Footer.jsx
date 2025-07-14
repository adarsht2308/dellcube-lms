import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-[#292928] py-4">
      <div className="container mx-auto px-4 md:px-10 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p className="text-sm text-white text-center sm:text-left">
          © 2025 Dellcube. All rights reserved.
        </p>
        <p className="text-sm text-white text-center sm:text-right">
          Designed and developed by{" "}
          <a
            href="https://servora.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#FFCA00] hover:underline"
          >
            Servora
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
