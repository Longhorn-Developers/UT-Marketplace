"use client";
import { usePathname } from 'next/navigation';

interface AdminRedirectWrapperProps {
  children: React.ReactNode;
  navbar: React.ReactNode;
  footer: React.ReactNode;
}

const AdminRedirectWrapper: React.FC<AdminRedirectWrapperProps> = ({ children, navbar, footer }) => {
  const pathname = usePathname();
  const hideChrome = pathname?.startsWith('/auth/confirmation/onboard');
  const isAdminRoute = pathname?.startsWith('/admin');

  if (hideChrome) {
    return <main className="flex-1">{children}</main>;
  }

  if (isAdminRoute) {
    return <>{children}</>;
  }

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
