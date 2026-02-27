"use client";
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldX, Clock, AlertTriangle } from 'lucide-react';
import { Suspense } from 'react';

function SuspendedContent() {
  const params = useSearchParams();
  const reason = params.get('reason');
  const untilParam = params.get('until');

  const isBanned = reason === 'banned';
  const suspensionUntil = untilParam ? new Date(decodeURIComponent(untilParam)) : null;

  const formattedDate = suspensionUntil
    ? suspensionUntil.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center space-y-6">

        {/* Icon */}
        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
          isBanned ? 'bg-red-100' : 'bg-orange-100'
        }`}>
          {isBanned
            ? <ShieldX size={32} className="text-red-600" />
            : <Clock size={32} className="text-orange-500" />}
        </div>

        {/* Heading */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isBanned ? 'Account Removed' : 'Account Restricted'}
          </h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            {isBanned
              ? 'Your account has been permanently removed from UT Marketplace due to repeated or severe policy violations.'
              : 'Your account is temporarily restricted. You may browse listings but cannot send messages or create new listings.'}
          </p>
        </div>

        {/* Suspension end date */}
        {!isBanned && formattedDate && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <p className="text-xs text-orange-600 font-medium uppercase tracking-wide mb-1">
              Restriction lifts on
            </p>
            <p className="text-orange-800 font-semibold">{formattedDate}</p>
            <p className="text-xs text-orange-500 mt-1">
              Your account will be automatically restored at that time.
            </p>
          </div>
        )}

        {/* What you can / can't do */}
        {!isBanned && (
          <div className="text-left bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              During restriction
            </p>
            <div className="space-y-1.5 text-sm">
              <p className="flex items-center gap-2 text-green-700">
                <span className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center text-xs">✓</span>
                Browse listings
              </p>
              <p className="flex items-center gap-2 text-green-700">
                <span className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center text-xs">✓</span>
                View profiles
              </p>
              <p className="flex items-center gap-2 text-red-600">
                <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-xs">✕</span>
                Send or receive messages
              </p>
              <p className="flex items-center gap-2 text-red-600">
                <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-xs">✕</span>
                Create new listings
              </p>
            </div>
          </div>
        )}

        {/* Policy notice */}
        <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-3 text-left">
          <AlertTriangle size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-500">
            This action was taken by the UT Marketplace moderation team in accordance
            with our community guidelines. If you believe this is an error, please
            contact support.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {!isBanned && (
            <Link
              href="/"
              className="block w-full py-2.5 px-4 bg-[#bf5700] hover:bg-[#a34800] text-white text-sm font-medium rounded-xl transition-colors text-center"
            >
              Browse Listings
            </Link>
          )}
          <Link
            href="/auth/login"
            className="block w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors text-center"
          >
            Sign in with a different account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuspendedPage() {
  return (
    <Suspense>
      <SuspendedContent />
    </Suspense>
  );
}
