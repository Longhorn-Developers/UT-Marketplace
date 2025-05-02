"use client";
import Link from "next/link";
import { useState } from "react";
import { FaUser, FaStore, FaComments, FaBell, FaBars } from "react-icons/fa";
import NavSearch from "./NavSearch";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-ut-orange p-4 text-white flex justify-between items-center shadow-md relative">
      <Link href="/" className="flex items-center gap-2 bg-ut-orange hover:bg-[#d95e00] text-white px-4 py-2 rounded-full font-bold transition duration-200 text-3xl tracking-tight">
        UT Marketplace
      </Link>
      {/* Hamburger icon for mobile */}
      <button
        className="md:hidden text-white text-2xl ml-auto"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <FaBars />
      </button>
      <div className={`flex-col md:flex md:flex-row md:space-x-6 md:items-center text-white text-2xl absolute md:static top-full left-0 w-full md:w-auto bg-ut-orange md:bg-transparent z-50 ${menuOpen ? 'flex' : 'hidden'} items-center justify-center space-y-4 md:space-y-0 p-4 md:p-0`}>
        <NavSearch/>
        <Link
          href="/create"
          title="Create Listing"
          className="flex items-center gap-2 bg-ut-orange hover:bg-[#d95e00] text-white px-4 py-2 rounded-full font-semibold transition duration-200"
        >
          <FaStore />
          <span className="text-lg">Create Listing</span>
        </Link>
        <Link
          href="/messages"
          title="Messages"
          className="relative flex items-center gap-2 bg-ut-orange hover:bg-[#d95e00] text-white px-4 py-2 rounded-full font-semibold transition duration-200"
        >
          <div className="relative flex items-center">
            <FaComments />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
          </div>
        </Link>
        <Link
          href="/notifications"
          title="Notifications"
          className="relative flex items-center gap-2 bg-ut-orange hover:bg-[#d95e00] text-white px-4 py-2 rounded-full font-semibold transition duration-200"
        >
          <div className="relative flex items-center">
            <FaBell />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
          </div>
        </Link>
        <Link
          href="/profile"
          title="Profile"
          className="flex items-center gap-2 bg-ut-orange hover:bg-[#d95e00] text-white px-4 py-2 rounded-full font-semibold transition duration-200"
        >
          <FaUser />
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
