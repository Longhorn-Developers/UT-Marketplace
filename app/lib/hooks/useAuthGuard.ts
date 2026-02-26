"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { requiresAuth } from "../routes/access";
import { supabase } from "../supabaseClient";
import { useEffect, useState } from "react";

export const useAuthGuard = () => {
  const pathname = usePathname() || "/";
  const { user, loading, isAdmin } = useAuth();
  const isProtected = requiresAuth(pathname);
  const [sessionUser, setSessionUser] = useState<typeof user>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          setSessionUser(session?.user ?? null);
        }
      } finally {
        if (isMounted) {
          setSessionLoading(false);
        }
      }
    };
    loadSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const effectiveUser = user ?? sessionUser;

  return {
    user: effectiveUser,
    loading: loading || sessionLoading,
    isAdmin,
    isProtected,
  };
};
