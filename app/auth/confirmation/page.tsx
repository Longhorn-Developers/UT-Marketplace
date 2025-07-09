'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function Confirmation() {
  const [message, setMessage] = useState('Checking your confirmation status...');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const router = useRouter();

  const handleResendConfirmation = async () => {
    if (!email) return;
    
    setIsResending(true);
    setResendSuccess(false);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
      
      setResendSuccess(true);
      setMessage('Confirmation email resent! Please check your inbox.');
    } catch (error) {
      console.error('Error resending confirmation:', error);
      setMessage('Failed to resend confirmation. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };
  
  // Check URL for confirmation status on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    const confirmedParam = params.get('confirmed') === 'true';
    
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
    
    if (confirmedParam) {
      setIsConfirmed(true);
      setMessage('Email confirmed! Redirecting you to your account...');
      
      // Redirect to onboarding after a short delay
      const timer = setTimeout(() => {
        router.push('/auth/confirmation/onboard');
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      // If not confirmed, check auth status periodically
      const checkAuthStatus = async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) throw error;
          
          if (session?.user) {
            setIsConfirmed(true);
            setMessage('Email confirmed! Redirecting you to your account...');
            router.push('/auth/confirmation/onboard');
          }
        } catch (error) {
          console.error('Error checking auth status:', error);
        }
      };
      
      // Check immediately
      checkAuthStatus();
      
      // Then check every 5 seconds
      const interval = setInterval(checkAuthStatus, 5000);
      
      return () => clearInterval(interval);
    }
  }, [router]);

  useEffect(() => {
    // Only run auth check if not already confirmed via URL
    if (!isConfirmed) {
      const checkAuth = async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) throw error;
          
          if (session?.user) {
            setIsConfirmed(true);
            setMessage('Email confirmed! Redirecting you to your account...');
            
            // Redirect to onboarding after a short delay
            setTimeout(() => {
              router.push('/auth/confirmation/onboard');
            }, 3000);
          } else {
            setMessage('Please check your email and click the confirmation link we sent you.');
          }
        } catch (error) {
          setMessage('An error occurred while checking your confirmation status.');
          console.error('Confirmation error:', error);
        }
      };

      checkAuth();

      // Set up a real-time subscription to listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setIsConfirmed(true);
          setMessage('Email confirmed! Redirecting you to your account...');
          
          // Redirect to onboarding after a short delay
          setTimeout(() => {
            router.push('/auth/confirmation/onboard');
          }, 2000);
        }
      });

      // Cleanup subscription on unmount
      return () => {
        subscription?.unsubscribe();
      };
    }
  }, [isConfirmed, router]);

  // Handle back to sign in
  const handleBackToSignIn = () => {
    router.push('/auth/signin');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
              isConfirmed ? 'bg-green-100' : 'bg-blue-50'
            }`}>
              {isConfirmed ? (
                <svg className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              )}
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isConfirmed ? 'Email Confirmed! 🎉' : 'Check Your Email'}
          </h2>
          <p className="text-sm text-gray-600">
            {message}
          </p>
          
          {!isConfirmed && (
            <div className="mt-6 space-y-3">
              {email && (
                <div className="text-sm text-gray-600">
                  <p className="text-gray-600 mb-3">Didn't receive the email? Check your spam folder or</p>
                  <button
                    onClick={handleResendConfirmation}
                    disabled={isResending || resendSuccess}
                    className={`mt-2 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      isResending || resendSuccess 
                        ? 'bg-gray-400' 
                        : 'bg-ut-orange hover:bg-orange-600'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500`}
                  >
                    {isResending 
                      ? 'Sending...' 
                      : resendSuccess 
                        ? 'Sent! Check your email' 
                        : 'Resend confirmation email'}
                  </button>
                </div>
              )}
              <div className="pt-2">
                <button
                  onClick={handleBackToSignIn}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Return to Sign In
                </button>
              </div>
            </div>
          )}
          
          {isConfirmed && (
            <div className="mt-6">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ut-orange"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
