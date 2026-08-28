/**
 * Safe Auth Error Normalization Utility for ParkEase
 * Converts Supabase / Auth errors into clean, human-readable strings.
 * Guarantees that raw objects like '{}', '[object Object]', null, or undefined are never rendered in the UI.
 */

export function getAuthErrorMessage(
  error: unknown,
  fallbackMessage = 'Unable to sign in right now. Please try again.'
): string {
  // Safe development diagnostic logging (NO sensitive secrets, passwords, or tokens)
  if (import.meta.env.DEV && error) {
    if (typeof error === 'object' && error !== null) {
      const e = error as Record<string, any>;
      console.warn('[ParkEase Auth Diagnostic]', {
        name: e.name,
        message: typeof e.message === 'string' ? e.message : undefined,
        code: e.code,
        status: e.status || e.statusCode,
      });
    } else {
      console.warn('[ParkEase Auth Diagnostic]', String(error));
    }
  }

  if (!error) return fallbackMessage;

  let rawMessage: string | null = null;
  let errorCode: string | null = null;

  if (typeof error === 'string') {
    rawMessage = error;
  } else if (error instanceof Error) {
    rawMessage = error.message;
    errorCode = (error as any).code || null;
  } else if (typeof error === 'object' && error !== null) {
    const e = error as Record<string, any>;
    if (typeof e.message === 'string') rawMessage = e.message;
    else if (typeof e.error_description === 'string') rawMessage = e.error_description;
    else if (typeof e.error === 'string') rawMessage = e.error;

    if (typeof e.code === 'string') errorCode = e.code;
  }

  // Clean and validate rawMessage
  if (!rawMessage || rawMessage === '{}' || rawMessage === '[object Object]' || rawMessage.trim() === '') {
    return fallbackMessage;
  }

  const lowerMsg = rawMessage.toLowerCase();
  const lowerCode = errorCode?.toLowerCase() || '';

  // 1. Invalid credentials
  if (
    lowerMsg.includes('invalid login credentials') ||
    lowerMsg.includes('invalid_credentials') ||
    lowerCode.includes('invalid_credentials') ||
    lowerMsg.includes('invalid email or password')
  ) {
    return 'Incorrect email or password. Please check your details and try again.';
  }

  // 2. Email not confirmed
  if (
    lowerMsg.includes('email not confirmed') ||
    lowerMsg.includes('email_not_confirmed') ||
    lowerCode.includes('email_not_confirmed') ||
    lowerMsg.includes('not verified')
  ) {
    return 'Please verify your email address before signing in.';
  }

  // 3. Too many requests / rate limit
  if (
    lowerMsg.includes('too many requests') ||
    lowerMsg.includes('rate limit') ||
    lowerMsg.includes('over_email_send_rate_limit') ||
    lowerCode.includes('over_email_send_rate_limit')
  ) {
    return 'Too many attempts. Please wait a moment and try again.';
  }

  // 4. Network or connectivity errors
  if (
    lowerMsg.includes('failed to fetch') ||
    lowerMsg.includes('network error') ||
    lowerMsg.includes('networkerror')
  ) {
    return 'Unable to connect to the authentication service. Please check your internet connection.';
  }

  // 5. User already exists
  if (
    lowerMsg.includes('user already registered') ||
    lowerMsg.includes('user_already_exists')
  ) {
    return 'An account with this email already exists. Please sign in instead.';
  }

  // Return original safe message if useful
  return rawMessage;
}
