"use client";
import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { ReportService, USER_REPORT_REASONS } from '../../app/lib/database/ReportService';

interface ReportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUserName: string;
  reporterId: string | null;
}

const ReportUserModal: React.FC<ReportUserModalProps> = ({
  isOpen,
  onClose,
  reportedUserId,
  reportedUserName,
  reporterId
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reporterId) {
      setError('You must be signed in to report users');
      return;
    }

    if (!selectedReason) {
      setError('Please select a reason for reporting');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await ReportService.reportUser({
        reportedUserId,
        reporterId,
        reason: selectedReason,
        description: description.trim() || undefined
      });

      if (result.success) {
        setSubmitSuccess(true);
        setTimeout(() => {
          onClose();
          // Reset form
          setSelectedReason('');
          setDescription('');
          setSubmitSuccess(false);
        }, 2000);
      } else {
        setError(result.error || 'Failed to submit report');
      }
    } catch (error) {
      setError('An error occurred while submitting the report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedReason('');
      setDescription('');
      setError('');
      setSubmitSuccess(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  if (submitSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">✓</span>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Report Submitted</h3>
            <p className="text-gray-600">
              Thank you for reporting this user. We will review your report and take appropriate action.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-500" />
            <h2 className="text-lg font-bold text-gray-900">Report User</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              You are reporting: <span className="font-medium">{reportedUserName}</span>
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Why are you reporting this user? <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {USER_REPORT_REASONS.map((reason) => (
                <label key={reason.key} className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={reason.key}
                    checked={selectedReason === reason.key}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="mt-1 text-[#bf5700] focus:ring-[#bf5700]"
                    disabled={isSubmitting}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{reason.label}</div>
                    <div className="text-xs text-gray-600">{reason.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional details (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide any additional information about why you're reporting this user..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bf5700] focus:border-transparent resize-none"
              disabled={isSubmitting}
              maxLength={500}
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {description.length}/500
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedReason}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportUserModal;