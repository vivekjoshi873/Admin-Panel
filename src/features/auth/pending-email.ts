const PENDING_EMAIL_KEY = 'bingo.pendingEmail';
const PENDING_OTP_PURPOSE_KEY = 'bingo.pendingOtpPurpose';
const PENDING_RESET_OTP_KEY = 'bingo.pendingResetOtp';
const PENDING_RESET_TOKEN_KEY = 'bingo.pendingResetToken';

export type OtpPurpose = 'email-verify' | 'reset-password';

export function stashPendingEmail(email: string, purpose?: OtpPurpose) {
  try {
    sessionStorage.setItem(PENDING_EMAIL_KEY, email);
    if (purpose) sessionStorage.setItem(PENDING_OTP_PURPOSE_KEY, purpose);
  } catch {
    // ignore
  }
}

export function readPendingEmail(): string | null {
  try {
    return sessionStorage.getItem(PENDING_EMAIL_KEY);
  } catch {
    return null;
  }
}

export function readPendingOtpPurpose(): OtpPurpose | null {
  try {
    return sessionStorage.getItem(PENDING_OTP_PURPOSE_KEY) as OtpPurpose | null;
  } catch {
    return null;
  }
}

export function stashPendingResetOtp(otp: string) {
  try {
    sessionStorage.setItem(PENDING_RESET_OTP_KEY, otp);
  } catch {
    // ignore
  }
}

export function readPendingResetOtp(): string | null {
  try {
    return sessionStorage.getItem(PENDING_RESET_OTP_KEY);
  } catch {
    return null;
  }
}

/** Silent stash when the email link includes ?token=… — never shown in the UI. */
export function stashPendingResetToken(token: string | null | undefined) {
  if (!token) return;
  try {
    sessionStorage.setItem(PENDING_RESET_TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function readPendingResetToken(): string | null {
  try {
    return sessionStorage.getItem(PENDING_RESET_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearPendingEmail() {
  try {
    sessionStorage.removeItem(PENDING_EMAIL_KEY);
    sessionStorage.removeItem(PENDING_OTP_PURPOSE_KEY);
    sessionStorage.removeItem(PENDING_RESET_OTP_KEY);
    sessionStorage.removeItem(PENDING_RESET_TOKEN_KEY);
  } catch {
    // ignore
  }
}
