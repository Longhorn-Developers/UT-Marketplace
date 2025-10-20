"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Loader2
} from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

interface TermsData {
  id: string | null;
  title: string;
  content: string;
  version: number;
  last_updated: string;
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, onAccept }) => {
  const [terms, setTerms] = useState<TermsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTerms();
    }
  }, [isOpen]);

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
      .replace(/^- (.*$)/gim, '<li class="flex items-start gap-2 mb-2"><span class="w-2 h-2 bg-ut-orange rounded-full mt-2 flex-shrink-0"></span><span>$1</span></li>')
      .replace(/\n\n/gim, '</p><p class="text-gray-700 leading-relaxed mb-4">')
      .replace(/\n/gim, '<br>');
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-blur-md backdrop-blur-lg bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-gray-100"
          onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="bg-ut-orange text-white">
              <div className="flex items-center justify-between p-6 border-b border-ut-orange">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{terms?.title || 'Terms and Conditions'}</h2>
                    <p className="text-ut-orange text-sm">UT Marketplace Legal Agreement</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
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
              <div className="max-w-none">
                {/* Header Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-[#bf5700]" />
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
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: `<p class="text-gray-700 leading-relaxed mb-4">${renderMarkdownContent(terms.content)}</p>` 
                    }}
                  />
                    </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Terms Available</h3>
                  <p className="text-gray-600">Terms and conditions are not currently available.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-ut-orange" />
                <div>
                  <p className="text-ut-orange font-medium text-sm">Ready to proceed?</p>
                  <p className="text-ut-orange text-xs">Click below to acknowledge and continue</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (onAccept) {
                    onAccept();
                  }
                  onClose();
                }}
                className="px-6 py-2 bg-ut-orange text-white rounded-lg font-semibold hover:bg-ut-orange transition-colors duration-200 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                I Understand
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TermsModal;
