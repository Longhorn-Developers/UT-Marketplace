"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isSuspended: boolean;
  suspensionUntil: Date | null;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
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

    return () => subscription.unsubscribe();
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?type=signup&email=${encodeURIComponent(email)}`,
      },
    });
    
    return { error };
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