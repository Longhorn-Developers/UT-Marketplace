"use client";

import React, { useState, useEffect } from 'react';
import { FileText, Clock, Loader2, AlertTriangle } from 'lucide-react';

interface TermsData {
  id: string | null;
  title: string;
  content: string;
  version: number;
  last_updated: string;
}

const TermsPage = () => {
  const [terms, setTerms] = useState<TermsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/terms');
      if (!response.ok) {
        throw new Error('Failed to fetch terms');
      }
      const data = await response.json();
      setTerms(data);
    } catch (error) {
      console.error('Error fetching terms:', error);
      setError('Failed to load terms and conditions');
    } finally {
      setLoading(false);
    }
  };

  const renderMarkdownContent = (content: string) => {
    // Simple markdown to HTML conversion for basic formatting
    return content
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mb-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-gray-900 mb-3 mt-6">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium text-gray-900 mb-2 mt-4">$1</h3>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')
      .replace(/^- (.*$)/gim, '<li class="flex items-start gap-2 mb-2"><span class="w-2 h-2 bg-[#bf5700] rounded-full mt-2 flex-shrink-0"></span><span>$1</span></li>')
      .replace(/\n\n/gim, '</p><p class="text-gray-700 leading-relaxed mb-4">')
      .replace(/\n/gim, '<br>');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#bf5700] to-[#a54700] text-white p-8">
            <h1 className="text-4xl font-bold mb-2">{terms?.title || 'Terms and Conditions'}</h1>
            <p className="text-xl text-white/90">
              UT Marketplace - The official marketplace for UT Austin community
            </p>
            {terms && (
              <div className="flex items-center gap-2 mt-2">
                <Clock className="w-4 h-4 text-white/80" />
                <p className="text-sm text-white/80">
                  Last updated: {new Date(terms.last_updated).toLocaleDateString()} • Version {terms.version}
                </p>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#bf5700] mr-3" />
                <span className="text-gray-600">Loading terms and conditions...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Terms</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={fetchTerms}
                  className="px-4 py-2 bg-[#bf5700] text-white rounded-lg hover:bg-[#a54700] transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : terms ? (
              <div className="prose prose-lg max-w-none">
                {/* Header Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[#bf5700]" />
                    <div>
                      <p className="text-gray-600 text-sm">
                        <strong>Last updated:</strong> {new Date(terms.last_updated).toLocaleDateString()}
                      </p>
                      <p className="text-gray-500 text-xs">Version {terms.version}</p>
                    </div>
                  </div>
                </div>

                {/* Dynamic Content */}
                <div 
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: `<p class="text-gray-700 leading-relaxed mb-4">${renderMarkdownContent(terms.content)}</p>` 
                  }}
                />

                <div className="mt-8 p-6 bg-[#bf5700] bg-opacity-10 rounded-lg border-l-4 border-[#bf5700]">
                  <p className="text-white font-medium text-lg">
                    By using UT Marketplace, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Terms Available</h3>
                <p className="text-gray-600">Terms and conditions are not currently available.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;