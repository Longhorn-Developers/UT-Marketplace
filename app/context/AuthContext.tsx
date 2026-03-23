"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { isAllowedUtAustinEmail, UT_AUSTIN_EMAIL_ERROR_MESSAGE } from '../lib/auth/emailDomain';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isSuspended: boolean;
  suspensionUntil: Date | null;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null; status?: 'sent' | 'existing-confirmed' | 'existing-unverified' }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspensionUntil, setSuspensionUntil] = useState<Date | null>(null);
  const router = useRouter();

  useEffect(() => {
    let loadingTimeout: ReturnType<typeof setTimeout> | null = null;
    loadingTimeout = setTimeout(() => {
      setLoading(false);
    }, 4000);

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkUserStatus(session.user.id);
      } else {
        setIsAdmin(false);
        setIsSuspended(false);
        setSuspensionUntil(null);
      }
      setLoading(false);
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    });

    // Listen for changes on auth state (signed in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkUserStatus(session.user.id);
      } else {
        setIsAdmin(false);
        setIsSuspended(false);
        setSuspensionUntil(null);
      }
      setLoading(false);
      router.refresh();
    });

    return () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
      subscription.unsubscribe();
    };
  }, [router]);

  const checkUserStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_admin, is_suspended, suspension_until')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setIsAdmin(data.is_admin || false);

        // Check if suspension is still active
        const until = data.suspension_until ? new Date(data.suspension_until) : null;
        const stillSuspended = data.is_suspended && until !== null && until > new Date();

        setIsSuspended(stillSuspended);
        setSuspensionUntil(stillSuspended ? until : null);

        // Auto-lift if the suspension period has passed
        if (data.is_suspended && (!until || until <= new Date())) {
          supabase
            .from('users')
            .update({ is_suspended: false, suspension_until: null })
            .eq('id', userId)
            .then(() => {});
        }
      }
    } catch (error) {
      console.error('Error checking user status:', error);
      setIsAdmin(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return { error };
  };

  const signUp: AuthContextType['signUp'] = async (email: string, password: string) => {
    const normalizedEmail = email.trim();

    if (!isAllowedUtAustinEmail(normalizedEmail)) {
      return { 
        error: { 
          message: UT_AUSTIN_EMAIL_ERROR_MESSAGE,
          name: 'AuthError',
          status: 400
        } as AuthError 
      };
    }
    
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?type=signup&email=${encodeURIComponent(normalizedEmail)}`,
      },
    });

    if (error) {
      // Handle duplicate confirmed accounts
      const message = (error.message || '').toLowerCase();
      if (message.includes('already registered') || message.includes('user already') || message.includes('registered')) {
        return { error, status: 'existing-confirmed' };
      }
      return { error };
    }

    // Supabase returns an empty identities array when the email already exists but is unconfirmed.
    if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return { error: null, status: 'existing-unverified' };
    }
    
    return { error: null, status: 'sent' };
  };

  const signOut = async () => {
    setIsAdmin(false);
    setIsSuspended(false);
    setSuspensionUntil(null);
    setUser(null);
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isSuspended, suspensionUntil, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
