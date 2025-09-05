"use client";
import React from 'react';
import AdminNavbar from './AdminNavbar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <main className="flex-1">
        {children}
      </main>
      
      {/* Optional Admin Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-6 h-6 bg-[#bf5700] rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">UT</span>
              </div>
              <span className="text-sm">UT Marketplace Admin Panel</span>
            </div>
            <div className="text-sm text-gray-500">
              © 2024 University of Texas at Austin
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminLayout;