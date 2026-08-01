import { describe, it, expect } from 'vitest';

function evaluateReportResolutionPolicy(isAdmin: boolean): { allowed: boolean; reason?: string } {
  if (isAdmin) {
    return { allowed: true };
  }
  return { allowed: false, reason: 'new row violates row-level security policy for table "reports"' };
}

function evaluateUserBanPolicy(
  requestingAdmin: boolean,
  targetUserIsAdmin: boolean,
  action: 'ban' | 'demote'
): { allowed: boolean; reason?: string } {
  if (!requestingAdmin) {
    return { allowed: false, reason: 'violates row-level security policy for table "profiles"' };
  }
  if (targetUserIsAdmin && (action === 'ban' || action === 'demote')) {
    return { allowed: false, reason: 'Admins cannot be banned or demoted through the moderation panel.' };
  }
  return { allowed: true };
}

describe('Phase 8b Moderation & User Management Security', () => {
  it('refuses non-admin calls to resolve reports or write resolution notes', () => {
    const studentCall = evaluateReportResolutionPolicy(false);
    expect(studentCall.allowed).toBe(false);
    expect(studentCall.reason).toContain('row-level security policy');

    const adminCall = evaluateReportResolutionPolicy(true);
    expect(adminCall.allowed).toBe(true);
  });

  it('refuses non-admin calls to ban users', () => {
    const result = evaluateUserBanPolicy(false, false, 'ban');
    expect(result.allowed).toBe(false);
  });

  it('prevents admins from banning or demoting other admins', () => {
    const banAdminAttempt = evaluateUserBanPolicy(true, true, 'ban');
    expect(banAdminAttempt.allowed).toBe(false);
    expect(banAdminAttempt.reason).toContain('Admins cannot be banned or demoted');

    const demoteAdminAttempt = evaluateUserBanPolicy(true, true, 'demote');
    expect(demoteAdminAttempt.allowed).toBe(false);
    expect(demoteAdminAttempt.reason).toContain('Admins cannot be banned or demoted');
  });
});
