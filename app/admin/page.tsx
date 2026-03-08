"use client";
import React from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminDashboard from '../../components/admin/AdminDashboard';

export default function AdminPage() {
  return (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  );
}
