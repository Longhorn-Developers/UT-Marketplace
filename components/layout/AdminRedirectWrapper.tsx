"use client";
import { useAuth } from '../../app/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AdminRedirectWrapperProps {
  children: React.ReactNode;
  navbar: React.ReactNode;
  footer: React.ReactNode;
}

const AdminRedirectWrapper: React.FC<AdminRedirectWrapperProps> = ({ children, navbar, footer }) => {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted on client before making admin decisions
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only run redirect logic after component is mounted on client
    if (!mounted || loading || pathname?.startsWith('/admin')) {
      return;
    }

    // Debug logging
    console.log('AdminRedirectWrapper - Auth State:', {
      mounted,
      loading,
      pathname,
      user: user?.email,
      isAdmin,
      userExists: !!user
    });

    // If user is an admin and not on an admin page, redirect to admin dashboard
    if (user && isAdmin) {
      console.log('Redirecting admin user to /admin');
      router.push('/admin');
    }
  }, [mounted, user, isAdmin, loading, pathname, router]);

  // During SSR or initial hydration, always show regular layout to prevent mismatch
  if (!mounted || loading) {
    return (
      <>
        {navbar}
        <main className="flex-1">
          {children}
        </main>
        {footer}
      </>
    );
  }

  // If admin is being redirected, show loading state
  if (user && isAdmin && !pathname?.startsWith('/admin')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bf5700] mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to admin panel...</p>
        </div>
      </div>
    );
  }

  // If user is admin and on admin pages, don't show regular navbar/footer
  if (user && isAdmin && pathname?.startsWith('/admin')) {
    return <>{children}</>;
  }

  // Regular users get the normal layout
  return (
    <>
      {navbar}
      <main className="flex-1">
        {children}
      </main>
      {footer}
    </>
  );
};

export default AdminRedirectWrapper;