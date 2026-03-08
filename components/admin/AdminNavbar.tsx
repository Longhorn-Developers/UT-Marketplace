"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { LogOut, User, Bell, Settings, Shield, Menu, X } from "lucide-react";
import { useAuth } from "../../app/context/AuthContext";

const AdminNavbar = () => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setProfileMenuOpen(false);
  };

  return (
    <div className="bg-[#bf5700] shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link
              href="/admin"
              className="flex items-center gap-3 text-white text-2xl font-bold"
            >
              <div className="bg-white/20 rounded-lg p-2">
                <Shield size={24} className="text-white" />
              </div>
              UT Marketplace Admin
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <nav className="flex items-center space-x-6">
              <Link
                href="/admin"
                className="text-white/90 hover:text-white font-medium transition-colors duration-200"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/listings"
                className="text-white/90 hover:text-white font-medium transition-colors duration-200"
              >
                Listings
              </Link>
              <Link
                href="/admin/users"
                className="text-white/90 hover:text-white font-medium transition-colors duration-200"
              >
                Users
              </Link>
              <Link
                href="/admin/reports"
                className="text-white/90 hover:text-white font-medium transition-colors duration-200"
              >
                Reports
              </Link>
            </nav>

            {/* Admin Actions */}
            <div className="flex items-center space-x-4 border-l border-white/20 pl-6">
              <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors duration-200">
                <Bell size={20} className="text-white" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  3
                </span>
              </button>

              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                  <span className="text-white font-medium">Admin</span>
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.email?.split('@')[0] || 'Admin'}
                      </p>
                      <p className="text-xs text-gray-600">{user?.email}</p>
                    </div>
                    
                    <Link
                      href="/admin/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <Settings size={16} className="mr-2" />
                      Admin Settings
                    </Link>
                    
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut size={16} className="mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white p-2 rounded-lg hover:bg-white/10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/20 py-4">
            <div className="flex flex-col space-y-4">
              <Link
                href="/admin"
                className="text-white/90 hover:text-white font-medium transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/admin/listings"
                className="text-white/90 hover:text-white font-medium transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Listings
              </Link>
              <Link
                href="/admin/users"
                className="text-white/90 hover:text-white font-medium transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Users
              </Link>
              <Link
                href="/admin/reports"
                className="text-white/90 hover:text-white font-medium transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Reports
              </Link>
              
              <div className="border-t border-white/20 pt-4 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">
                      {user?.email?.split('@')[0] || 'Admin'}
                    </p>
                    <p className="text-white/70 text-xs">{user?.email}</p>
                  </div>
                </div>
                
                <Link
                  href="/admin/settings"
                  className="flex items-center text-white/90 hover:text-white font-medium transition-colors duration-200 mb-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings size={16} className="mr-2" />
                  Admin Settings
                </Link>
                
                <button
                  onClick={handleSignOut}
                  className="flex items-center text-white/90 hover:text-white font-medium transition-colors duration-200"
                >
                  <LogOut size={16} className="mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNavbar;
