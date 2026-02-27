import { supabaseAdmin } from '../supabaseAdmin';

export type Severity = 'low' | 'medium' | 'high';
export type ActionTaken = 'warning' | 'temp_suspension' | 'permanent_ban' | 'dismiss';

// ─── Severity Configuration ───────────────────────────────────────────────────

/** How many strikes each severity level adds */
export const SEVERITY_STRIKE_VALUES: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

/** Maps report reason keys → severity level */
export const REPORT_SEVERITY_MAP: Record<string, Severity> = {
  // Listing reasons
  spam: 'low',
  duplicate: 'low',
  other: 'low',
  fake: 'medium',
  inappropriate: 'medium',
  scam: 'high',
  prohibited: 'high',
  // User reasons
  harassment: 'medium',
  scammer: 'high',
  fake_profile: 'medium',
  impersonation: 'medium',
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const SEVERITY_DESCRIPTIONS: Record<string, { severity: Severity; immediateAction: string; description: string }> = {
  spam:          { severity: 'low',    immediateAction: 'Flag for review',                        description: 'Repetitive or irrelevant content submitted by a user.' },
  fake:          { severity: 'medium', immediateAction: 'Content review + possible removal',      description: 'Item descriptions or images that misrepresent the actual product.' },
  inappropriate: { severity: 'medium', immediateAction: 'Content review + possible removal',      description: 'Content that violates community standards or is offensive.' },
  scam:          { severity: 'high',   immediateAction: 'Immediate content removal + ban',        description: 'Fraud or sellers attempting to deceive for financial gain.' },
  prohibited:    { severity: 'high',   immediateAction: 'Immediate content removal + ban',        description: 'Listing of items that are illegal or explicitly banned by platform policy.' },
  harassment:    { severity: 'medium', immediateAction: 'Content review + possible action',       description: 'User is harassing or threatening other members.' },
  scammer:       { severity: 'high',   immediateAction: 'Immediate account action + ban',         description: 'User is running scams or committing fraud.' },
  fake_profile:  { severity: 'medium', immediateAction: 'Account review + possible removal',      description: 'User profile appears fake or impersonating someone.' },
  impersonation: { severity: 'medium', immediateAction: 'Account review + possible removal',      description: 'User is impersonating another person or entity.' },
  duplicate:     { severity: 'low',    immediateAction: 'Flag for review',                        description: 'This is a duplicate of another listing.' },
  other:         { severity: 'low',    immediateAction: 'Flag for review',                        description: 'Other violation not listed.' },
};

// ─── Action Thresholds (cumulative strikes) ───────────────────────────────────

export const ACTION_THRESHOLDS = {
  WARNING: 1,    // 1–2 strikes → warning
  SUSPENSION: 3, // 3–5 strikes → temp suspension
  BAN: 6,        // 6+ strikes  → permanent ban
};

/** Default suspension days per action level */
export const DEFAULT_SUSPENSION_DAYS = 7;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StrikeRecord {
  id: string;
  user_id: string;
  report_id?: string;
  report_type?: 'listing' | 'user';
  severity: Severity;
  strike_value: number;
  action_taken: ActionTaken;
  admin_id?: string;
  notes?: string;
  created_at: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class StrikeService {
  /** Returns the severity level for a given report reason key */
  static getSeverityForReason(reason: string): Severity {
    return REPORT_SEVERITY_MAP[reason] ?? 'low';
  }

  /** Returns the total cumulative strike count for a user */
  static async getUserStrikeTotal(userId: string): Promise<number> {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_strikes')
        .select('strike_value')
        .eq('user_id', userId);

      if (error || !data) return 0;
      return data.reduce((sum, s) => sum + (s.strike_value ?? 1), 0);
    } catch {
      return 0;
    }
  }

  /** Returns the full strike history for a user */
  static async getUserStrikes(userId: string): Promise<StrikeRecord[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_strikes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data;
    } catch {
      return [];
    }
  }

  /**
   * Determines what action should be taken given the NEW total strikes
   * and the severity of the current report.
   */
  static determineAction(newTotal: number, severity: Severity): ActionTaken {
    // High severity always escalates to at least temp_suspension
    if (severity === 'high') {
      if (newTotal >= ACTION_THRESHOLDS.BAN) return 'permanent_ban';
      return 'temp_suspension';
    }

    if (newTotal >= ACTION_THRESHOLDS.BAN) return 'permanent_ban';
    if (newTotal >= ACTION_THRESHOLDS.SUSPENSION) return 'temp_suspension';
    if (newTotal >= ACTION_THRESHOLDS.WARNING) return 'warning';
    return 'dismiss';
  }

  /**
   * Returns the recommended action before a strike is actually added.
   * Useful for showing recommended action in the admin UI.
   */
  static async getRecommendedAction(userId: string, severity: Severity): Promise<ActionTaken> {
    const currentTotal = await this.getUserStrikeTotal(userId);
    const newTotal = currentTotal + SEVERITY_STRIKE_VALUES[severity];
    return this.determineAction(newTotal, severity);
  }

  /**
   * Adds a strike record, then returns the new cumulative total.
   */
  static async addStrike(params: {
    userId: string;
    severity: Severity;
    reportId?: string;
    reportType?: 'listing' | 'user';
    adminId?: string;
    notes?: string;
    actionTaken: ActionTaken;
  }): Promise<{ success: boolean; newTotal: number; error?: string }> {
    try {
      const strikeValue = SEVERITY_STRIKE_VALUES[params.severity];

      const { error } = await supabaseAdmin.from('user_strikes').insert({
        user_id: params.userId,
        report_id: params.reportId ?? null,
        report_type: params.reportType ?? null,
        severity: params.severity,
        strike_value: strikeValue,
        action_taken: params.actionTaken,
        admin_id: params.adminId ?? null,
        notes: params.notes ?? null,
      });

      if (error) {
        console.error('Error adding strike:', error);
        return { success: false, newTotal: 0, error: error.message };
      }

      const newTotal = await this.getUserStrikeTotal(params.userId);
      return { success: true, newTotal };
    } catch (error) {
      console.error('Exception adding strike:', error);
      return { success: false, newTotal: 0, error: 'Failed to add strike' };
    }
  }

  /**
   * Applies a user-level account restriction (suspend or ban).
   * For 'warning' and 'dismiss', no DB change is needed.
   */
  static async applyUserRestriction(params: {
    userId: string;
    action: ActionTaken;
    suspensionDays?: number;
  }): Promise<{ success: boolean; suspensionUntil?: Date; error?: string }> {
    try {
      if (params.action === 'permanent_ban') {
        const { error } = await supabaseAdmin
          .from('users')
          .update({ is_banned: true, is_suspended: false, suspension_until: null })
          .eq('id', params.userId);

        if (error) return { success: false, error: error.message };
        return { success: true };
      }

      if (params.action === 'temp_suspension') {
        const days = params.suspensionDays ?? DEFAULT_SUSPENSION_DAYS;
        const until = new Date();
        until.setDate(until.getDate() + days);

        const { error } = await supabaseAdmin
          .from('users')
          .update({ is_suspended: true, suspension_until: until.toISOString() })
          .eq('id', params.userId);

        if (error) return { success: false, error: error.message };
        return { success: true, suspensionUntil: until };
      }

      // 'warning' and 'dismiss' → no account-level change
      return { success: true };
    } catch (error) {
      console.error('Exception applying user restriction:', error);
      return { success: false, error: 'Failed to apply restriction' };
    }
  }
}
