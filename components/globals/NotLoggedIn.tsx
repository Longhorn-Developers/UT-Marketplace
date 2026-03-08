"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { LogIn, UserX } from 'lucide-react';

interface NotLoggedInProps {
  message?: string;
  showLoginButton?: boolean;
  className?: string;
}

const NotLoggedIn: React.FC<NotLoggedInProps> = ({ 
  message = "You're not logged in", 
  showLoginButton = true,
  className = ""
}) => {
  const router = useRouter();

  const handleLoginClick = () => {
    router.push('/auth/signin');
  };

  return (
    <motion.div 
      className={`flex flex-col items-center justify-center min-h-[60vh] text-center ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <UserX className="w-8 h-8 text-gray-500" />
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900">
            {message}
          </h2>
          
          <p className="text-gray-600 text-sm">
            Please log in to access this feature and start using UT Marketplace.
          </p>
          
          {showLoginButton && (
            <button
              onClick={handleLoginClick}
              className="flex items-center gap-2 px-6 py-3 bg-[#bf5700] text-white rounded-lg hover:bg-[#a54700] transition-colors duration-200 font-medium cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Go to Login
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default NotLoggedIn;
