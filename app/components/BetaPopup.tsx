'use client';

import { useState } from 'react';
import { X, Github, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function BetaPopup() {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 p-6 z-50 animate-fade-in">
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      >
        <X size={20} />
      </button>

      <div className="flex items-center gap-2 mb-3">
        <span className="px-2 py-1 bg-[#bf5700] text-white text-xs font-semibold rounded-full">
          BETA
        </span>
        <h3 className="text-lg font-semibold text-gray-900">Welcome to UT Marketplace!</h3>
      </div>

      <p className="text-gray-600 text-sm mb-4">
        We&apos;re currently in beta testing. Your feedback helps us improve!
      </p>

      <div className="space-y-3">
        <Link
          href="https://github.com/Austin616/utmarketplace/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#bf5700] transition"
        >
          <Github size={16} />
          Report bugs on GitHub
        </Link>

        <a
          href="mailto:austintran616@utexas.edu?subject=UT%20Marketplace%20Improvement%20Suggestion"
          className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#bf5700] transition"
        >
          <MessageCircle size={16} />
          Suggest improvements
        </a>
      </div>
    </div>
  );
} 