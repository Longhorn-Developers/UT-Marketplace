import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRole) {
  throw new Error('Missing Supabase environment variables');
}

const db = createClient(supabaseUrl, supabaseServiceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUUID(v: string) { return UUID_REGEX.test(v); }

type Action = 'warn' | 'temp_suspend' | 'ban' | 'dismiss';
type Severity = 'low' | 'medium' | 'high';

const STRIKE_VALUES: Record<Severity, number> = { low: 1, medium: 2, high: 3 };
const DEFAULT_SUSPENSION_DAYS = 7;

// ─── Notification helpers (all fire-and-forget, never block the response) ─────

async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  relatedId?: string
) {
  await db.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    related_id: relatedId ?? null,
    is_read: false,
  });
}

async function notifyReporterActionTaken(reporterId: string) {
  await createNotification(
    reporterId,
    'action_taken',
    'Report Update',
    'Update: The account you reported has been actioned by our moderation team.'
  );
}

async function notifyWarning(userId: string, listingTitle?: string) {
  const part = listingTitle ? ` for "${listingTitle}"` : '';
  await createNotification(
    userId,
    'warning',
    'Policy Violation Warning',
    `Your listing${part} was removed for violating our community guidelines. This is a warning.`
  );
}

async function notifyTempSuspension(userId: string, until: Date) {
  const untilStr = until.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
  await createNotification(
    userId,
    'temp_suspension',
    'Account Temporarily Restricted',
    `Your account is temporarily restricted. You may browse but cannot message or create listings until ${untilStr}.`
  );
}

async function notifyPermanentBan(userId: string) {
  await createNotification(
    userId,
    'permanent_ban',
    'Account Removed',
    'Your account has been permanently removed from UT Marketplace due to repeated or severe policy violations.'
  );
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      reportId,
      reportType,   // 'listing' | 'user'
      adminId,
      action,       // 'warn' | 'temp_suspend' | 'ban' | 'dismiss'
      suspensionDays,
      notes,
    }: {
      reportId: string;
      reportType: 'listing' | 'user';
      adminId: string;
      action: Action;
      suspensionDays?: number;
      notes?: string;
    } = body;

    // ── Input validation ──────────────────────────────────────────────────────
    if (!reportId || !isValidUUID(reportId)) {
      return NextResponse.json({ success: false, error: 'Valid report ID is required' }, { status: 400 });
    }
    if (reportType !== 'listing' && reportType !== 'user') {
      return NextResponse.json({ success: false, error: 'reportType must be "listing" or "user"' }, { status: 400 });
    }
    if (!adminId || !isValidUUID(adminId)) {
      return NextResponse.json({ success: false, error: 'Valid admin ID is required' }, { status: 400 });
    }
    const validActions: Action[] = ['warn', 'temp_suspend', 'ban', 'dismiss'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    // ── Admin verification ────────────────────────────────────────────────────
    const { data: adminData, error: adminError } = await db
      .from('users')
      .select('is_admin')
      .eq('id', adminId)
      .single();

    if (adminError || !adminData?.is_admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // ── Fetch report ──────────────────────────────────────────────────────────
    const reportTable = reportType === 'listing' ? 'listing_reports' : 'user_reports';
    const { data: report, error: reportError } = await db
      .from(reportTable)
      .select('*')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
    }

    const reporterId: string = report.reporter_id;
    const reason: string = report.reason ?? 'other';

    // Determine severity from the report's reason key
    const SEVERITY_MAP: Record<string, Severity> = {
      spam: 'low', duplicate: 'low', other: 'low',
      fake: 'medium', inappropriate: 'medium',
      harassment: 'medium', fake_profile: 'medium', impersonation: 'medium',
      scam: 'high', prohibited: 'high', scammer: 'high',
    };
    const severity: Severity = SEVERITY_MAP[reason] ?? 'low';

    // ── For listing reports: resolve the listing owner's user ID ──────────────
    let listingOwnerId: string | null = null;
    let listingTitle: string | null = null;

    if (reportType === 'listing') {
      const { data: listing } = await db
        .from('listings')
        .select('id, title, user_id')
        .eq('id', report.listing_id)
        .single();

      if (listing) {
        listingOwnerId = listing.user_id;
        listingTitle = listing.title;
      }
    }

    // The user to receive strikes / restrictions
    const targetUserId = reportType === 'listing' ? listingOwnerId : report.reported_user_id;

    // ── Handle DISMISS ────────────────────────────────────────────────────────
    if (action === 'dismiss') {
      await db
        .from(reportTable)
        .update({ status: 'dismissed', reviewed_at: new Date().toISOString(), reviewed_by: adminId })
        .eq('id', reportId);

      return NextResponse.json({ success: true, action: 'dismiss' });
    }

    // ── Actions that require a valid target user ───────────────────────────────
    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: 'Could not resolve the user to act on' },
        { status: 404 }
      );
    }

    // ── Add strike ────────────────────────────────────────────────────────────
    const strikeValue = STRIKE_VALUES[severity];
    await db.from('user_strikes').insert({
      user_id: targetUserId,
      report_id: reportId,
      report_type: reportType,
      severity,
      strike_value: strikeValue,
      action_taken: action,
      admin_id: adminId,
      notes: notes ?? null,
    });

    // Compute new strike total
    const { data: strikeRows } = await db
      .from('user_strikes')
      .select('strike_value')
      .eq('user_id', targetUserId);
    const newStrikeTotal = (strikeRows ?? []).reduce(
      (sum: number, r: { strike_value: number }) => sum + (r.strike_value ?? 1), 0
    );

    // ── Apply account restriction ─────────────────────────────────────────────
    let suspensionUntil: Date | null = null;

    if (action === 'ban') {
      await db
        .from('users')
        .update({ is_banned: true, is_suspended: false, suspension_until: null })
        .eq('id', targetUserId);
    } else if (action === 'temp_suspend') {
      const days = typeof suspensionDays === 'number' && suspensionDays > 0
        ? suspensionDays
        : DEFAULT_SUSPENSION_DAYS;
      suspensionUntil = new Date();
      suspensionUntil.setDate(suspensionUntil.getDate() + days);

      await db
        .from('users')
        .update({ is_suspended: true, suspension_until: suspensionUntil.toISOString() })
        .eq('id', targetUserId);
    }
    // 'warn' → no account status change

    // ── For listing reports: delete the listing (except for 'warn') ───────────
    if (reportType === 'listing' && action !== 'warn' && report.listing_id) {
      const listingId: string = report.listing_id;
      await db.from('user_favorites').delete().eq('listing_id', listingId);
      await db.from('listing_reports').delete().eq('listing_id', listingId);
      await db.from('listings').delete().eq('id', listingId);
    } else {
      // Just mark the individual report as resolved (listing still exists for 'warn')
      await db
        .from(reportTable)
        .update({ status: 'resolved', reviewed_at: new Date().toISOString(), reviewed_by: adminId })
        .eq('id', reportId);
    }

    // ── For user reports: mark report resolved ────────────────────────────────
    if (reportType === 'user') {
      await db
        .from(reportTable)
        .update({ status: 'resolved', reviewed_at: new Date().toISOString(), reviewed_by: adminId })
        .eq('id', reportId);
    }

    // ── Audit log ─────────────────────────────────────────────────────────────
    await db.from('admin_audit_log').insert({
      admin_id: adminId,
      action: `report_action_${action}`,
      target_id: targetUserId,
      details: {
        report_id: reportId,
        report_type: reportType,
        severity,
        strike_value: strikeValue,
        new_strike_total: newStrikeTotal,
        action,
        suspension_until: suspensionUntil?.toISOString() ?? null,
        notes,
      },
      created_at: new Date().toISOString(),
    }).then(({ error }) => {
      if (error) console.warn('Audit log failed:', error);
    });

    // ── Send notifications (fire-and-forget) ──────────────────────────────────
    const notifPromises: Promise<void>[] = [];

    // Reporter: "we took action"
    notifPromises.push(notifyReporterActionTaken(reporterId));

    // Reported user: message depends on action
    if (action === 'warn') {
      notifPromises.push(notifyWarning(targetUserId, listingTitle ?? undefined));
    } else if (action === 'temp_suspend' && suspensionUntil) {
      notifPromises.push(notifyTempSuspension(targetUserId, suspensionUntil));
    } else if (action === 'ban') {
      notifPromises.push(notifyPermanentBan(targetUserId));
    }

    await Promise.allSettled(notifPromises);

    return NextResponse.json({
      success: true,
      action,
      severity,
      newStrikeTotal,
      suspensionUntil: suspensionUntil?.toISOString() ?? null,
    });
  } catch (error) {
    console.error('Exception in take-action route:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
