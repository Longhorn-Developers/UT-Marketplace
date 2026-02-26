'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import TermsModal from '../../../components/modals/TermsModal';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const { signIn, signUp } = useAuth();
  const router = useRouter();

  // Check for error parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, []);

  // Validate email domain for UT Austin
  const validateEmailDomain = (email: string): boolean => {
    return email.toLowerCase().endsWith('@utexas.edu');
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    // Clear email error when user starts typing
    if (emailError) {
      setEmailError(null);
    }
    
    // Validate domain only if user is signing up and has entered an email
    if (isSignUp && newEmail && !validateEmailDomain(newEmail)) {
      setEmailError('Please use your UT Austin email');
    } else if (isSignUp && newEmail && validateEmailDomain(newEmail)) {
      setEmailError(null);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    
    // Clear password error when user starts typing
    if (passwordError) {
      setPasswordError(null);
    }
    
    // Validate password match if in sign-up mode and confirm password is filled
    if (isSignUp && confirmPassword && newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
    } else if (isSignUp && confirmPassword && newPassword === confirmPassword) {
      setPasswordError(null);
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    
    // Clear password error when user starts typing
    if (passwordError) {
      setPasswordError(null);
    }
    
    // Validate password match
    if (isSignUp && password && newConfirmPassword !== password) {
      setPasswordError('Passwords do not match');
    } else if (isSignUp && password && newConfirmPassword === password) {
      setPasswordError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailError(null);
    setPasswordError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Validate email domain before attempting sign up
        if (!validateEmailDomain(email)) {
          setEmailError('Please use your UT Austin email');
          setLoading(false);
          return;
        }
        
        // Validate password confirmation
        if (password !== confirmPassword) {
          setPasswordError('Passwords do not match');
          setLoading(false);
          return;
        }
        
        // Validate terms acceptance
        if (!termsAccepted) {
          setError('Please accept the Terms and Conditions to continue');
          setLoading(false);
          return;
        }
        
        const { error, status } = await signUp(email, password);

        if (status === 'existing-confirmed') {
          setError('This email is already associated with an existing account.');
          setLoading(false);
          return;
        }

        if (status === 'existing-unverified') {
          setError('Please check your email to complete verification.');
          // Send them to confirmation page where they can resend
          router.push(`/auth/confirmation?email=${encodeURIComponent(email)}`);
          setLoading(false);
          return;
        }

        if (error) throw error;
        
        // Redirect to confirmation page with email
        router.push(`/auth/confirmation?email=${encodeURIComponent(email)}`);
        return;
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        
        // Check if user needs to complete onboarding
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('users')
            .select('onboard_complete, is_admin')
            .eq('id', user.id)
            .single();

          if (profile?.is_admin) {
            router.push('/admin');
            return;
          }

          if (!profile?.onboard_complete) {
            router.push('/auth/confirmation/onboard');
          } else {
            router.push('/');
          }
        }
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
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white px-4 py-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-7xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row"
      >
        {/* Left Side - Branding & Welcome */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex-1 bg-ut-orange p-12 flex flex-col items-center lg:items-start justify-center text-center lg:text-left text-white"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3, type: "spring", stiffness: 200 }}
            className="mb-8"
          >
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl">
              <Image src="/icons/utmplogo.png" alt="UT Marketplace" width={60} height={60} className="rounded-full" />
            </div>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-4xl lg:text-6xl font-bold text-white tracking-tight mb-6"
          >
            UT Marketplace
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-xl text-white/90 mb-8 max-w-md leading-relaxed"
          >
            Your trusted marketplace for buying, selling, and trading within the UT Austin community. Connect with fellow Longhorns and discover amazing deals right on campus.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-col gap-4 text-white/90"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-white rounded-full"></div>
              <span className="text-lg">Exclusive to UT Austin students and faculty</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-white rounded-full"></div>
              <span className="text-lg">Secure payments and verified users</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-white rounded-full"></div>
              <span className="text-lg">Quick and easy campus transactions</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-white rounded-full"></div>
              <span className="text-lg">Find textbooks, furniture, and more</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Side - Form */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex-1 p-12 bg-white flex flex-col justify-center"
        >
          <motion.h2 
            key={isSignUp ? 'signup' : 'signin'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center text-2xl font-extrabold text-gray-900 mb-6"
          >
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </motion.h2>
          
          {/* Segmented Control */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="flex bg-gray-100 rounded-lg p-1 mb-6 relative w-full max-w-lg mx-auto "
          >
            <motion.button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setEmailError(null);
                setPasswordError(null);
                setError(null);
                setConfirmPassword('');
              }}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md relative z-10 transition-colors duration-200 cursor-pointer ${
                !isSignUp
                  ? 'text-[#bf5700]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Sign In
            </motion.button>
            <motion.button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setEmailError(null);
                setPasswordError(null);
                setError(null);
                setConfirmPassword('');
              }}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md relative z-10 transition-colors duration-200 cursor-pointer ${
                isSignUp
                  ? 'text-[#bf5700]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Sign Up
            </motion.button>
            
            {/* Animated background */}
            <motion.div
              className="absolute top-1 bottom-1 bg-white rounded-md shadow-sm"
              initial={false}
              animate={{
                x: isSignUp ? 'calc(100%)' : '0',
                width: 'calc(50%)'
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            />
          </motion.div>
          
          <motion.p 
            key={isSignUp ? 'signup-desc' : 'signin-desc'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center text-gray-500 text-sm mb-6"
          >
            {isSignUp ? 'Join the UT community and start listing!' : 'Welcome back! Sign in to continue.'}
          </motion.p>
          
          <motion.button
            type="button"
            onClick={handleGoogleSignIn}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-lg bg-white text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mb-6 cursor-pointer"
            disabled={loading}
          >
            <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><g clipPath="url(#clip0_17_40)"><path d="M47.532 24.552c0-1.636-.146-3.2-.418-4.704H24.48v9.12h13.008c-.56 2.96-2.24 5.456-4.768 7.136v5.888h7.712c4.512-4.16 7.104-10.288 7.104-17.44z" fill="#4285F4"/><path d="M24.48 48c6.48 0 11.92-2.144 15.888-5.824l-7.712-5.888c-2.144 1.44-4.896 2.288-8.176 2.288-6.288 0-11.616-4.256-13.52-9.968H2.56v6.176C6.512 43.36 14.56 48 24.48 48z" fill="#34A853"/><path d="M10.96 28.608A14.88 14.88 0 0 1 9.6 24c0-1.6.288-3.152.8-4.608v-6.176H2.56A23.52 23.52 0 0 0 .48 24c0 3.872.928 7.52 2.08 10.784l8.4-6.176z" fill="#FBBC05"/><path d="M24.48 9.6c3.52 0 6.624 1.216 9.088 3.584l6.784-6.784C36.384 2.144 30.96 0 24.48 0 14.56 0 6.512 4.64 2.56 13.216l8.4 6.176c1.904-5.712 7.232-9.968 13.52-9.968z" fill="#EA4335"/></g><defs><clipPath id="clip0_17_40"><path fill="#fff" d="M0 0h48v48H0z"/></clipPath></defs></svg>
            Continue with Google
          </motion.button>
          
          <motion.div 
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="flex items-center w-full my-6"
          >
            <div className="flex-1 h-px bg-gray-200" />
            <span className="mx-4 text-gray-400 text-sm font-medium">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </motion.div>
          
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="w-full space-y-5 min-h-[250px]" 
            onSubmit={handleSubmit}
          >
          {/* Horizontal Email and Password Row */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.9 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <div className="space-y-1">
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <motion.input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ut-orange focus:border-transparent text-sm transition-all duration-200 ${
                  emailError ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400 focus:border-ut-orange'
                }`}
                placeholder="Enter your UT Austin email"
                value={email}
                onChange={handleEmailChange}
                disabled={loading}
                whileFocus={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              />
              <AnimatePresence>
                {emailError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-red-500 text-xs mt-1 px-1 flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {emailError}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <motion.input
                  id="password"
                  name="password"
                type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                className={`block w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ut-orange focus:border-transparent text-sm transition-all duration-200 ${
                  passwordError ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400 focus:border-ut-orange'
                }`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={handlePasswordChange}
                disabled={loading}
                whileFocus={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
                />
              <motion.button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ut-orange text-sm transition-colors duration-200"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                whileHover={{ scale: 1.1, cursor: 'pointer' }}
                whileTap={{ scale: 0.9 }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </motion.button>
              </div>
            </div>
          </motion.div>
          {/* Confirm Password Row - Always present but conditionally visible */}
          <motion.div 
            initial={false}
            animate={{ 
              opacity: isSignUp ? 1 : 0,
              height: isSignUp ? 'auto' : '0px',
              marginBottom: isSignUp ? '0px' : '0px'
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <motion.input
                    id="confirm-password"
                    name="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required={isSignUp}
                    className={`block w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ut-orange focus:border-transparent text-sm transition-all duration-200 ${
                      passwordError ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400 focus:border-ut-orange'
                    }`}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    disabled={loading}
                    whileFocus={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  />
                  <motion.button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ut-orange text-sm transition-colors duration-200"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    whileHover={{ scale: 1.1, cursor: 'pointer' }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </motion.button>
                </div>
              </div>
              <div className="space-y-1">
                {/* Empty space to maintain grid alignment */}
                <div className="h-6"></div>
                <div className="h-12"></div>
              </div>
            </div>
          </motion.div>
          <AnimatePresence>
            {passwordError && (
              <motion.div 
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ duration: 0.2 }}
                className="text-red-500 text-xs mt-1 px-1 flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {passwordError}
              </motion.div>
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ duration: 0.2 }}
                className="text-red-500 text-sm text-center mt-2 flex items-center justify-center gap-1"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Terms and Conditions Checkbox - Only show for sign-up */}
          <AnimatePresence>
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden mt-4"

              >
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center h-5">
                    <input
                      id="terms-checkbox"
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="w-4 h-4 text-[#bf5700] bg-gray-100 border-gray-300 rounded focus:ring-[#bf5700] focus:ring-2"
                      disabled={loading}
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="terms-checkbox" className="text-sm text-gray-700 cursor-pointer">
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="text-[#bf5700] hover:text-[#a54700] underline font-medium transition-colors duration-200"
                        disabled={loading}
                      >
                        Terms and Conditions
                      </button>
                      {' '}and understand that I must use my UT Austin email address.
                    </label>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Submit Button Row */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.1 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4"
          >
            <motion.button
              type="submit"
              disabled={loading || (isSignUp && !termsAccepted)}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="w-full lg:col-span-2 flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-[#bf5700] hover:bg-[#a54700] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#bf5700] transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="#fff" d="M4 12a8 8 0 018-8v8z"></path></svg>
                Loading...
              </span>
            ) : isSignUp ? 'Create Account' : 'Sign In'}
            </motion.button>
          </motion.div>
          </motion.form>
        </motion.div>
      </motion.div>
      
      {/* Terms and Conditions Modal */}
      <TermsModal 
        isOpen={showTermsModal} 
        onClose={() => setShowTermsModal(false)}
        onAccept={() => setTermsAccepted(true)}

      />
    </div>
  );
} 
