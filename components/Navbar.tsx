"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { FaUser, FaBars } from "react-icons/fa";
import { MessageCircle, Settings, LogOut } from "lucide-react";
import NavSearch from "./NavSearch";
import { useAuth } from '../app/context/AuthContext';
import Notifications from "../app/components/Notifications";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setProfileMenuOpen(false);
  };

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
            <Link
              href="/messages"
              className="relative p-2 hover:bg-white/10 rounded-full transition"
            >
              <MessageCircle size={20} className="text-white" />
            </Link>
            <Notifications />
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="p-2 hover:bg-white/10 rounded-full transition"
              >
                <FaUser size={20} className="text-white" />
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                  <Link
                    href="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <FaUser size={16} className="mr-2" />
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <Settings size={16} className="mr-2" />
                    Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut size={16} className="mr-2" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
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
            {user ? (
              <>
                <Link
                  href="/messages"
                  className="text-white hover:text-white/80 transition font-semibold"
                  onClick={() => setMenuOpen(false)}
                >
                  Messages
                </Link>
                <Link
                  href="/profile"
                  className="text-white hover:text-white/80 transition font-semibold"
                  onClick={() => setMenuOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="text-white hover:text-white/80 transition font-semibold"
                  onClick={() => setMenuOpen(false)}
                >
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-white hover:text-white/80 transition font-semibold text-left"
                >
                  Sign out
                </button>
              </>
            ) : (
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
