"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { AdminService } from '../../lib/database/AdminService';
import { useAuth } from '../../context/AuthContext';
import {
  AlertTriangle, Clock, CheckCircle2, XCircle, Eye, Search,
  User, FileText, ShieldAlert, ShieldX, ShieldCheck, Zap,
  ChevronDown, BarChart2,
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminLayout from '../../../components/admin/AdminLayout';
import { SEVERITY_DESCRIPTIONS, SEVERITY_STRIKE_VALUES, type Severity } from '../../lib/database/StrikeService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReportData {
  id: string;
  type: 'listing' | 'user';
  reason: string;
  severity: Severity;
  description?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  reporter_id: string;
  reported_listing_id?: string;
  reported_user_id?: string;
  listing_user_id?: string;
  listing_title?: string;
  reported_user_name?: string;
  reporter_name?: string;
  // Populated after fetching strike data
  targetUserStrikes?: number;
  recommendedAction?: string;
}

type ActionOption = 'warn' | 'temp_suspend' | 'ban' | 'dismiss';
type SeverityFilter = 'all' | Severity;
type StatusFilter = 'all' | 'pending' | 'resolved' | 'dismissed';
type TypeFilter = 'all' | 'listing' | 'user';

// ─── Severity helpers ─────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<Severity, {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
}> = {
  low: {
    label: 'Low',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50',
    border: 'border-yellow-300',
    icon: <ShieldCheck size={12} className="text-yellow-600" />,
  },
  medium: {
    label: 'Medium',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    icon: <ShieldAlert size={12} className="text-orange-600" />,
  },
  high: {
    label: 'High',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-300',
    icon: <ShieldX size={12} className="text-red-600" />,
  },
};

function getSeverityForReason(reason: string): Severity {
  const meta = SEVERITY_DESCRIPTIONS[reason];
  return meta?.severity ?? 'low';
}

function getRecommendedAction(strikes: number, severity: Severity): ActionOption {
  const newTotal = strikes + SEVERITY_STRIKE_VALUES[severity];
  if (severity === 'high') return newTotal >= 6 ? 'ban' : 'temp_suspend';
  if (newTotal >= 6) return 'ban';
  if (newTotal >= 3) return 'temp_suspend';
  if (newTotal >= 1) return 'warn';
  return 'dismiss';
}

// ─── Badge components ─────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: Severity }) {
  const cfg = SEVERITY_CONFIG[severity];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function StrikeBadge({ count }: { count: number }) {
  const color =
    count === 0 ? 'bg-gray-100 text-gray-500' :
    count <= 2  ? 'bg-yellow-100 text-yellow-700' :
    count <= 5  ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>
      <Zap size={10} />
      {count} strike{count !== 1 ? 's' : ''}
    </span>
  );
}

function RecommendedActionBadge({ action }: { action: ActionOption }) {
  const map: Record<ActionOption, { label: string; color: string }> = {
    warn:         { label: 'Warn',        color: 'bg-blue-100 text-blue-700' },
    temp_suspend: { label: 'Temp Suspend', color: 'bg-orange-100 text-orange-700' },
    ban:          { label: 'Permanent Ban', color: 'bg-red-100 text-red-700' },
    dismiss:      { label: 'Dismiss',      color: 'bg-gray-100 text-gray-500' },
  };
  const { label, color } = map[action];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock size={10} /> Pending
        </span>
      );
    case 'resolved':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle2 size={10} /> Resolved
        </span>
      );
    case 'dismissed':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          <XCircle size={10} /> Dismissed
        </span>
      );
    default:
      return null;
  }
}

// ─── Action Modal ─────────────────────────────────────────────────────────────

interface ActionModalProps {
  report: ReportData;
  onClose: () => void;
  onActionTaken: () => void;
  adminId: string;
}

function ActionModal({ report, onClose, onActionTaken, adminId }: ActionModalProps) {
  const [action, setAction] = useState<ActionOption>(
    report.recommendedAction as ActionOption ?? 'warn'
  );
  const [suspensionDays, setSuspensionDays] = useState(7);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const severityCfg = SEVERITY_CONFIG[report.severity];
  const meta = SEVERITY_DESCRIPTIONS[report.reason];

  async function handleSubmit() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/take-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: report.id,
          reportType: report.type,
          adminId,
          action,
          suspensionDays: action === 'temp_suspend' ? suspensionDays : undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const msgs: Record<ActionOption, string> = {
          warn:         'Warning issued. User notified.',
          temp_suspend: `Account suspended for ${suspensionDays} days. User notified.`,
          ban:          'Account permanently banned. User notified.',
          dismiss:      'Report dismissed.',
        };
        toast.success(msgs[action]);
        onActionTaken();
        onClose();
      } else {
        toast.error(data.error ?? 'Failed to take action');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Take Action on Report</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle size={22} />
            </button>
          </div>

          {/* Report summary */}
          <div className={`rounded-lg p-4 border ${severityCfg.bg} ${severityCfg.border}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm text-gray-800 capitalize">
                {report.type === 'listing' ? '📋 Listing' : '👤 User'} Report
              </span>
              <SeverityBadge severity={report.severity} />
            </div>
            <p className="text-sm font-semibold text-gray-900">{report.reason}</p>
            {meta && (
              <p className="text-xs text-gray-600 mt-1">{meta.description}</p>
            )}
            {report.type === 'listing' && report.listing_title && (
              <p className="text-xs text-blue-600 mt-1">Listing: {report.listing_title}</p>
            )}
            {report.type === 'user' && report.reported_user_name && (
              <p className="text-xs text-purple-600 mt-1">User: {report.reported_user_name}</p>
            )}
            {report.description && (
              <p className="text-xs text-gray-500 mt-2 italic">"{report.description}"</p>
            )}
          </div>

          {/* Strike context */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <BarChart2 size={16} className="text-gray-500" />
            <span className="text-sm text-gray-700">Current strike total:</span>
            <StrikeBadge count={report.targetUserStrikes ?? 0} />
            <span className="text-xs text-gray-400 ml-auto">
              +{SEVERITY_STRIKE_VALUES[report.severity]} on action
            </span>
          </div>

          {/* Recommended action note */}
          {report.recommendedAction && (
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <span>Recommended:</span>
              <RecommendedActionBadge action={report.recommendedAction as ActionOption} />
              <span className="ml-1">based on severity + strike history</span>
            </div>
          )}

          {/* Action selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Select Action</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'warn',         label: 'Issue Warning',    desc: 'Remove content, add 1 strike', color: 'border-blue-300 bg-blue-50 text-blue-800' },
                { value: 'temp_suspend', label: 'Temp Suspension',  desc: 'Restrict account temporarily',  color: 'border-orange-300 bg-orange-50 text-orange-800' },
                { value: 'ban',          label: 'Permanent Ban',    desc: 'Remove account permanently',    color: 'border-red-300 bg-red-50 text-red-800' },
                { value: 'dismiss',      label: 'Dismiss',          desc: 'No violation found',            color: 'border-gray-300 bg-gray-50 text-gray-600' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setAction(opt.value as ActionOption)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    action === opt.value
                      ? `${opt.color} font-semibold`
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-xs opacity-70 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Suspension days (only shown for temp_suspend) */}
          {action === 'temp_suspend' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Suspension Duration</label>
              <div className="flex gap-2">
                {[3, 7, 14, 30].map(d => (
                  <button
                    key={d}
                    onClick={() => setSuspensionDays(d)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                      suspensionDays === d
                        ? 'border-orange-500 bg-orange-50 text-orange-700 font-semibold'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Admin Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              maxLength={500}
              placeholder="Internal note about this action..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#bf5700] focus:border-transparent resize-none"
            />
          </div>

          {/* Notification preview */}
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
            <p className="font-medium text-gray-700">Notifications that will be sent:</p>
            <p>• <span className="font-medium">Reporter:</span> "Update: The account you reported has been actioned..."</p>
            {action === 'warn' && (
              <p>• <span className="font-medium">Reported user:</span> "Your listing was removed for violating... This is a warning."</p>
            )}
            {action === 'temp_suspend' && (
              <p>• <span className="font-medium">Reported user:</span> "Your account is temporarily restricted until [date]."</p>
            )}
            {action === 'ban' && (
              <p>• <span className="font-medium">Reported user:</span> "Your account has been permanently removed..."</p>
            )}
            {action === 'dismiss' && (
              <p className="text-gray-400 italic">No notifications sent on dismiss.</p>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
                action === 'dismiss' ? 'bg-gray-500 hover:bg-gray-600' :
                action === 'warn'    ? 'bg-blue-600 hover:bg-blue-700' :
                action === 'ban'     ? 'bg-red-600 hover:bg-red-700' :
                                      'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              {loading ? 'Processing...' : 'Confirm Action'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Details Modal (read-only view) ──────────────────────────────────────────

function DetailsModal({ report, onClose, onTakeAction }: {
  report: ReportData;
  onClose: () => void;
  onTakeAction: () => void;
}) {
  const meta = SEVERITY_DESCRIPTIONS[report.reason];
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Report Details</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle size={22} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Status</p>
              <div className="mt-1"><StatusBadge status={report.status} /></div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Severity</p>
              <div className="mt-1"><SeverityBadge severity={report.severity} /></div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Type</p>
              <p className="text-sm font-medium text-gray-800 capitalize mt-1">{report.type} report</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">User Strike Total</p>
              <div className="mt-1"><StrikeBadge count={report.targetUserStrikes ?? 0} /></div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reason</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">{report.reason}</p>
              {meta && <p className="text-xs text-gray-500 mt-0.5">{meta.description}</p>}
            </div>

            {report.description && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</p>
                <p className="text-sm text-gray-700 mt-1 bg-gray-50 rounded-lg p-3">{report.description}</p>
              </div>
            )}

            {report.type === 'listing' && report.listing_title && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reported Listing</p>
                <p className="text-sm text-blue-600 font-medium mt-1">{report.listing_title}</p>
              </div>
            )}

            {report.type === 'user' && report.reported_user_name && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reported User</p>
                <p className="text-sm text-purple-600 font-medium mt-1">{report.reported_user_name}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reported by</p>
                <p className="text-sm text-gray-800 mt-1">{report.reporter_name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date</p>
                <p className="text-sm text-gray-800 mt-1">{new Date(report.created_at).toLocaleString()}</p>
              </div>
            </div>

            {report.recommendedAction && (
              <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-3">
                <span className="text-xs text-blue-700">Recommended action:</span>
                <RecommendedActionBadge action={report.recommendedAction as ActionOption} />
              </div>
            )}
          </div>

          {report.status === 'pending' && (
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => { onClose(); onTakeAction(); }}
                className="px-4 py-2 text-sm font-medium text-white bg-[#bf5700] hover:bg-[#a34800] rounded-lg"
              >
                Take Action
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const AdminReportsPage = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAction, setShowAction] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const [listingRaw, userRaw] = await Promise.all([
        AdminService.getListingReports(200, 0),
        AdminService.getUserReports(200, 0),
      ]);

      const listingReports: ReportData[] = listingRaw.map(r => {
        const listing = r.listing as any;
        const reporter = r.reporter as any;
        const rawSeverity = (r as any).severity as Severity | undefined;
        const severity: Severity = rawSeverity ?? getSeverityForReason(r.reason);
        return {
          id: r.id,
          type: 'listing',
          reason: r.reason || 'Unknown',
          severity,
          description: r.description ?? '',
          status: (r.status as ReportData['status']) || 'pending',
          created_at: r.created_at,
          reporter_id: r.reporter_id,
          reported_listing_id: r.listing_id,
          listing_user_id: listing?.user_id,
          listing_title: listing?.title || 'Unknown Listing',
          reporter_name: reporter?.display_name || reporter?.email?.split('@')[0] || 'Unknown',
        };
      });

      const userReports: ReportData[] = userRaw.map(r => {
        const reportedUser = r.reported_user as any;
        const reporter = r.reporter as any;
        const rawSeverity = (r as any).severity as Severity | undefined;
        const severity: Severity = rawSeverity ?? getSeverityForReason(r.reason);
        return {
          id: r.id,
          type: 'user',
          reason: r.reason || 'Unknown',
          severity,
          description: r.description ?? '',
          status: (r.status as ReportData['status']) || 'pending',
          created_at: r.created_at,
          reporter_id: r.reporter_id,
          reported_user_id: r.reported_user_id,
          reported_user_name: reportedUser?.display_name || reportedUser?.email?.split('@')[0] || 'Unknown',
          reporter_name: reporter?.display_name || reporter?.email?.split('@')[0] || 'Unknown',
        };
      });

      const all = [...listingReports, ...userReports].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Fetch strike totals for target users (only pending, to keep it fast)
      const targetIds = Array.from(new Set(
        all
          .filter(r => r.status === 'pending')
          .map(r => r.type === 'listing' ? r.listing_user_id : r.reported_user_id)
          .filter(Boolean) as string[]
      ));

      let strikeTotals: Record<string, number> = {};
      if (targetIds.length > 0) {
        try {
          const res = await fetch('/api/admin/user-strikes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userIds: targetIds }),
          });
          if (res.ok) strikeTotals = await res.json();
        } catch {
          // Non-critical; fall through with zeros
        }
      }

      const enriched = all.map(r => {
        const targetId = r.type === 'listing' ? r.listing_user_id : r.reported_user_id;
        const strikes = targetId ? (strikeTotals[targetId] ?? 0) : 0;
        return {
          ...r,
          targetUserStrikes: strikes,
          recommendedAction: getRecommendedAction(strikes, r.severity),
        };
      });

      setReports(enriched);
    } catch (err) {
      console.error('Error fetching reports:', err);
      toast.error('Failed to fetch reports.');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const filtered = reports.filter(r => {
    if (typeFilter !== 'all' && r.type !== typeFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (severityFilter !== 'all' && r.severity !== severityFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        r.reason.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q) ||
        (r.listing_title ?? '').toLowerCase().includes(q) ||
        (r.reported_user_name ?? '').toLowerCase().includes(q) ||
        (r.reporter_name ?? '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pending = reports.filter(r => r.status === 'pending');
  const highSeverityPending = pending.filter(r => r.severity === 'high');

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bf5700]" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports Management</h1>
            <p className="text-gray-500 text-sm mt-0.5">Review, act on, and track reports with severity & strike tracking</p>
          </div>
          <button
            onClick={fetchReports}
            className="self-start px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Severity Reference Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
            <AlertTriangle size={15} className="text-orange-500" />
            <h2 className="text-sm font-semibold text-gray-700">Severity Reference</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Report Type</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Severity</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Strikes Added</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Immediate Action</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {Object.entries(SEVERITY_DESCRIPTIONS).map(([key, meta]) => (
                  <tr key={key} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2 font-medium text-gray-800 capitalize">{key.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-2"><SeverityBadge severity={meta.severity} /></td>
                    <td className="px-4 py-2 text-gray-600">+{SEVERITY_STRIKE_VALUES[meta.severity]}</td>
                    <td className="px-4 py-2 text-gray-600">{meta.immediateAction}</td>
                    <td className="px-4 py-2 text-gray-500">{meta.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Pending',        value: pending.length,                            icon: <Clock className="h-4 w-4 text-yellow-600" />,    bg: 'bg-yellow-50' },
            { label: 'High Severity',  value: highSeverityPending.length,                icon: <ShieldX className="h-4 w-4 text-red-600" />,      bg: 'bg-red-50' },
            { label: 'Resolved',       value: reports.filter(r => r.status === 'resolved').length,   icon: <CheckCircle2 className="h-4 w-4 text-green-600" />, bg: 'bg-green-50' },
            { label: 'Listing Reports',value: reports.filter(r => r.type === 'listing').length,      icon: <FileText className="h-4 w-4 text-blue-600" />,    bg: 'bg-blue-50' },
            { label: 'User Reports',   value: reports.filter(r => r.type === 'user').length,         icon: <User className="h-4 w-4 text-purple-600" />,     bg: 'bg-purple-50' },
          ].map(stat => (
            <div key={stat.label} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${stat.bg}`}>{stat.icon}</div>
                <div>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Strike Legend */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Strike System</p>
          <div className="flex flex-wrap gap-3 text-xs text-gray-600">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-300 inline-block"/> 1–2 strikes → Warning</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-400 inline-block"/> 3–5 strikes → Temp Suspension</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"/> 6+ strikes → Permanent Ban</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-700 inline-block"/> High severity → Always Suspend/Ban</span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg w-full text-sm focus:ring-2 focus:ring-[#bf5700] focus:border-transparent"
              />
            </div>

            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value as SeverityFilter)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#bf5700] focus:border-transparent"
            >
              <option value="all">All Severities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as TypeFilter)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#bf5700] focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="listing">Listing Reports</option>
              <option value="user">User Reports</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as StatusFilter)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#bf5700] focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>
          <p className="text-xs text-gray-400 mt-2">{filtered.length} report{filtered.length !== 1 ? 's' : ''} shown</p>
        </div>

        {/* Reports Table */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Report</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Severity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User Strikes</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Recommended</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {filtered.map(report => (
                  <tr
                    key={`${report.type}-${report.id}`}
                    className={`hover:bg-gray-50 transition-colors ${
                      report.severity === 'high' && report.status === 'pending' ? 'border-l-4 border-l-red-400' :
                      report.severity === 'medium' && report.status === 'pending' ? 'border-l-4 border-l-orange-300' : ''
                    }`}
                  >
                    {/* Report description */}
                    <td className="px-4 py-3 max-w-xs">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 flex-shrink-0">
                          {report.type === 'listing'
                            ? <FileText size={15} className="text-blue-500" />
                            : <User size={15} className="text-purple-500" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 capitalize">{report.reason.replace(/_/g, ' ')}</p>
                          {report.type === 'listing' && report.listing_title && (
                            <p className="text-xs text-blue-600 truncate max-w-[180px]">📋 {report.listing_title}</p>
                          )}
                          {report.type === 'user' && report.reported_user_name && (
                            <p className="text-xs text-purple-600">👤 {report.reported_user_name}</p>
                          )}
                          {report.description && (
                            <p className="text-xs text-gray-400 truncate max-w-[180px]">{report.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">by {report.reporter_name}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <SeverityBadge severity={report.severity} />
                    </td>

                    <td className="px-4 py-3">
                      <StrikeBadge count={report.targetUserStrikes ?? 0} />
                    </td>

                    <td className="px-4 py-3">
                      {report.status === 'pending' && report.recommendedAction
                        ? <RecommendedActionBadge action={report.recommendedAction as ActionOption} />
                        : <span className="text-xs text-gray-400">—</span>}
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={report.status} />
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setSelectedReport(report); setShowDetails(true); }}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>
                        {report.status === 'pending' && (
                          <button
                            onClick={() => { setSelectedReport(report); setShowAction(true); }}
                            className="px-2 py-1 text-xs font-medium text-white bg-[#bf5700] hover:bg-[#a34800] rounded-lg transition-colors"
                          >
                            Act
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No reports found</p>
              <p className="text-gray-400 text-sm mt-1">
                {reports.length === 0
                  ? 'No reports have been submitted yet.'
                  : 'Try adjusting your filters.'}
              </p>
            </div>
          )}
        </div>

        {/* Modals */}
        {showDetails && selectedReport && (
          <DetailsModal
            report={selectedReport}
            onClose={() => { setShowDetails(false); setSelectedReport(null); }}
            onTakeAction={() => setShowAction(true)}
          />
        )}

        {showAction && selectedReport && user?.id && (
          <ActionModal
            report={selectedReport}
            adminId={user.id}
            onClose={() => { setShowAction(false); setSelectedReport(null); }}
            onActionTaken={fetchReports}
          />
        )}

        <ToastContainer position="bottom-right" />
      </div>
    </AdminLayout>
  );
};

export default AdminReportsPage;
