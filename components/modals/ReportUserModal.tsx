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
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100/80 p-4 backdrop-blur-sm"
        onClick={handleClose}
      >
        <div
          className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">✓</span>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Report Submitted</h3>
            <p className="text-gray-600">
              Your report has been submitted. Thank you for helping keep UTMP safe.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100/80 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-500" />
            <h2 className="text-lg font-bold text-gray-900">Report User</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
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
                <label
                  key={reason.key}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition-colors ${
                    selectedReason === reason.key
                      ? 'border-[#bf5700] bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
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
                    <div className="mt-0.5 text-xs text-gray-600">{reason.description}</div>
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
              className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-[#bf5700] focus:outline-none focus:ring-2 focus:ring-[#bf5700] resize-none"
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
              className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedReason}
              className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
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
