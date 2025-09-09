'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

export default function EmailConfirmed() {
  const router = useRouter();

  const handleGoToSignIn = () => {
    router.push('/auth/signin');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900">
            Email Confirmed! 🎉
          </h1>

          <p className="text-gray-600">
            Your email has been successfully verified. Welcome to UT Marketplace!
          </p>

          {/* Desktop: Show button to go to sign in page */}
          <div className="hidden md:block mt-8">
            <button
              onClick={handleGoToSignIn}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-ut-orange hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
            >
              Go to Sign In
            </button>
          </div>

          {/* Mobile: Show message to close tab and re-sign in on mobile app */}
          <div className="md:hidden mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm text-center">
              Please close this tab and re-sign in on the mobile app to continue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}