"use client";
import Link from "next/link";
import { useState } from "react";
import { FaUser, FaBars } from "react-icons/fa";
import NavSearch from "./NavSearch";
import { useAuth } from '../app/context/AuthContext';
import UserMenu from './UserMenu';
import Notifications from "../app/components/Notifications";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="bg-ut-orange p-4 text-white flex justify-between items-center shadow-md">
      <Link
        href="/"
        className="flex items-center gap-2 text-white text-3xl tracking-tight font-bold"
      >
        UT Marketplace
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center space-x-6">
        <Link
          href="/browse"
          className="text-white hover:text-white/80 transition font-semibold"
        >
          Browse
        </Link>
        <Link
          href="/my-listings"
          className="text-white hover:text-white/80 transition font-semibold"
        >
          My List
        </Link>
        
        {user ? (
          <div className="flex items-center space-x-4">
            <Notifications />
            <UserMenu />
          </div>
        ) : (
          <Link
            href="/auth/signin"
            className="text-white hover:text-white/80 transition font-semibold"
          >
            Sign In
          </Link>
        )}
      </div>

      {/* Mobile menu button */}
      <button
        className="md:hidden text-white"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <FaBars size={24} />
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-ut-orange md:hidden p-4 z-50">
          <div className="flex flex-col space-y-4">
            <Link
              href="/browse"
              className="text-white hover:text-white/80 transition font-semibold"
              onClick={() => setMenuOpen(false)}
            >
              Browse
            </Link>
            <Link
              href="/my-listings"
              className="text-white hover:text-white/80 transition font-semibold"
              onClick={() => setMenuOpen(false)}
            >
              My List
            </Link>
            {!user && (
              <Link
                href="/auth/signin"
                className="text-white hover:text-white/80 transition font-semibold"
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
