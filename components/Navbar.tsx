"use client";
import Link from "next/link";
import { useState } from "react";
import { FaUser, FaStore, FaComments, FaBell, FaBars } from "react-icons/fa";
import NavSearch from "./NavSearch";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-ut-orange p-4 text-white flex justify-between items-center shadow-md relative">
      <Link
        href="/"
        className="flex items-center gap-2 bg-ut-orange hover:bg-[#d95e00] text-white px-4 py-2 rounded-full font-bold transition duration-200 text-3xl tracking-tight"
      >
        UT Marketplace
      </Link>

      <div className="hidden md:flex space-x-6 absolute left-1/2 transform -translate-x-1/2">
        <Link
          href="browse"
          title="Browse"
          className="flex items-center gap-2 bg-ut-orange hover:bg-[#d95e00] text-white px-4 py-2 rounded-full font-semibold transition duration-200"
        >
          <span className="text-lg">Browse</span>
        </Link>
        <Link
          href="/my-listings"
          title="My Listings"
          className="flex items-center gap-2 bg-ut-orange hover:bg-[#d95e00] text-white px-4 py-2 rounded-full font-semibold transition duration-200"
        >
          <span className="text-lg">My Listings</span>
        </Link>
      </div>
      {/* Hamburger icon for mobile */}
      <button
        className="md:hidden text-white text-2xl ml-auto"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <FaBars />
      </button>
      <div className="hidden md:flex items-center space-x-4">
        <Link
          href="/create"
          title="Create Listing"
          className="flex items-center justify-center gap-2 bg-ut-orange hover:bg-[#d95e00] text-white px-4 py-2 rounded-full font-semibold transition duration-200"
        >
          <span className="text-lg">Create Listing</span>
        </Link>
        <Link
          href="/messages"
          title="Messages"
          className="relative flex items-center justify-center bg-ut-orange hover:bg-[#d95e00] text-white px-4 py-2 rounded-full font-semibold transition duration-200"
        >
          <div className="relative">
            <FaComments />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
          </div>
        </Link>
        <Link
          href="/notifications"
          title="Notifications"
          className="relative flex items-center justify-center bg-ut-orange hover:bg-[#d95e00] text-white px-4 py-2 rounded-full font-semibold transition duration-200"
        >
          <div className="relative">
            <FaBell />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
          </div>
        </Link>
        <Link
          href="/profile"
          title="Profile"
          className="flex items-center justify-center bg-ut-orange hover:bg-[#d95e00] text-white px-4 py-2 rounded-full font-semibold transition duration-200"
        >
          <FaUser />
        </Link>
      </div>
      <div
        className={`flex flex-col md:flex-row md:space-x-6 md:items-center absolute md:static top-full left-0 w-full md:w-auto bg-ut-orange md:bg-transparent z-50 ${
          menuOpen ? "flex" : "hidden"
        } p-4 md:p-0`}
      >
        <div className="w-full md:w-auto mb-4 md:mb-0">
          <NavSearch />
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <Link
            href="/create"
            title="Create Listing"
            className="flex items-center justify-center gap-2 bg-white text-[#bf5700] px-4 py-2 rounded-full font-semibold transition duration-200 w-full md:w-auto"
          >
            <span className="text-lg">Create Listing</span>
          </Link>
          <div className="flex justify-between md:justify-center gap-4 w-full md:w-auto">
            <Link
              href="/messages"
              title="Messages"
              className="relative flex items-center justify-center bg-white text-[#bf5700] px-4 py-2 rounded-full font-semibold transition duration-200 w-full md:w-auto"
            >
              <div className="relative">
                <FaComments />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
              </div>
            </Link>
            <Link
              href="/notifications"
              title="Notifications"
              className="relative flex items-center justify-center bg-white text-[#bf5700] px-4 py-2 rounded-full font-semibold transition duration-200 w-full md:w-auto"
            >
              <div className="relative">
                <FaBell />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
              </div>
            </Link>
            <Link
              href="/profile"
              title="Profile"
              className="flex items-center justify-center bg-white text-[#bf5700] px-4 py-2 rounded-full font-semibold transition duration-200 w-full md:w-auto"
            >
              <FaUser />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
