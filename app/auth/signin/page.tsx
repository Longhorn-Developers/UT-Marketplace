'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import Image from 'next/image';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        router.push('/settings');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white px-4 py-8 animate-fadein">
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <Image src="/icons/utmplogo.png" alt="UT Marketplace" width={56} height={56} className="rounded-full shadow" />
          <h1 className="text-2xl font-bold text-[#bf5700] tracking-tight">UT Marketplace</h1>
        </div>
        <div className="w-full">
          <h2 className="text-center text-2xl font-extrabold text-gray-900 mb-1">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </h2>
          <p className="text-center text-gray-500 text-sm mb-4">
            {isSignUp ? 'Join the UT community and start listing!' : 'Welcome back! Sign in to continue.'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-md bg-white text-gray-700 font-medium hover:bg-gray-50 transition mb-2 shadow-sm"
          disabled={loading}
        >
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><g clipPath="url(#clip0_17_40)"><path d="M47.532 24.552c0-1.636-.146-3.2-.418-4.704H24.48v9.12h13.008c-.56 2.96-2.24 5.456-4.768 7.136v5.888h7.712c4.512-4.16 7.104-10.288 7.104-17.44z" fill="#4285F4"/><path d="M24.48 48c6.48 0 11.92-2.144 15.888-5.824l-7.712-5.888c-2.144 1.44-4.896 2.288-8.176 2.288-6.288 0-11.616-4.256-13.52-9.968H2.56v6.176C6.512 43.36 14.56 48 24.48 48z" fill="#34A853"/><path d="M10.96 28.608A14.88 14.88 0 0 1 9.6 24c0-1.6.288-3.152.8-4.608v-6.176H2.56A23.52 23.52 0 0 0 .48 24c0 3.872.928 7.52 2.08 10.784l8.4-6.176z" fill="#FBBC05"/><path d="M24.48 9.6c3.52 0 6.624 1.216 9.088 3.584l6.784-6.784C36.384 2.144 30.96 0 24.48 0 14.56 0 6.512 4.64 2.56 13.216l8.4 6.176c1.904-5.712 7.232-9.968 13.52-9.968z" fill="#EA4335"/></g><defs><clipPath id="clip0_17_40"><path fill="#fff" d="M0 0h48v48H0z"/></clipPath></defs></svg>
          Continue with Google
        </button>
        <div className="flex items-center w-full my-2">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="mx-3 text-gray-400 text-xs font-medium">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <form className="w-full space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email-address" className="sr-only">
              Email address
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-t-md focus:outline-none focus:ring-[#bf5700] focus:border-[#bf5700] text-sm"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="relative">
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-b-md focus:outline-none focus:ring-[#bf5700] focus:border-[#bf5700] text-sm"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#bf5700] text-xs"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {error && (
            <div className="text-red-500 text-sm text-center mt-2">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-semibold rounded-md text-white bg-[#bf5700] hover:bg-[#a54700] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#bf5700] transition"
          >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="#fff" d="M4 12a8 8 0 018-8v8z"></path></svg>
                Loading...
              </span>
            ) : isSignUp ? 'Sign up' : 'Sign in'}
          </button>
          <div className="text-sm text-center mt-2">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-medium text-[#bf5700] hover:text-[#a54700] transition"
              disabled={loading}
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 