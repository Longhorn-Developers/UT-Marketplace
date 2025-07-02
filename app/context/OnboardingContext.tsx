"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabaseClient';

interface OnboardingContextType {
  isOnboarding: boolean;
  completeOnboarding: () => Promise<void>;
  checkOnboardingStatus: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [isOnboarding, setIsOnboarding] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const checkOnboardingStatus = useCallback(async () => {
    if (!user?.email) return;

    const { data, error } = await supabase
      .from('user_settings')
      .select('profile_image_url, bio')
      .eq('email', user.email)
      .single();

    if (error) {
      console.error('Error checking onboarding status:', error);
      return;
    }

    // Consider user in onboarding if they don't have both a profile image and bio
    const needsOnboarding = !data || (!data.profile_image_url && !data.bio);
    setIsOnboarding(needsOnboarding);

    if (needsOnboarding) {
      router.push('/profile?onboarding=true');
    }
  }, [user, router]);

  const completeOnboarding = async () => {
    setIsOnboarding(false);
  };

  useEffect(() => {
    if (user?.email) {
      checkOnboardingStatus();
    }
  }, [user, checkOnboardingStatus]);

  return (
    <OnboardingContext.Provider value={{ isOnboarding, completeOnboarding, checkOnboardingStatus }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
} 