"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { requiresAuth } from "../routes/access";

export const useAuthGuard = () => {
  const pathname = usePathname() || "/";
  const { user, loading, isAdmin } = useAuth();
  const isProtected = requiresAuth(pathname);

  return {
    user,
    loading,
    isAdmin,
    isProtected,
  };
};
