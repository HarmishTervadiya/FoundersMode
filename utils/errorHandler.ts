const ERROR_MESSAGES: Record<string, string> = {
  // SUPABASE / POSTGRES CODES
  '23505': 'This record already exists.',
  PGRST116: 'Data lookup failed. Please refresh and try again.',
  '42501': "You don't have permission to do this.",
  '403': "You don't have permission to do this.",

  // SUBSTRING MATCHES (Keywords)
  'Invalid login credentials': 'Incorrect email or password. Please try again.',
  'User already registered': 'This email is already in use.',
  'rate limit': 'Too many attempts. Please wait a moment.',
  'Network request failed': 'Network error. Please check your internet connection.',
  fetch: 'Network error. Please check your internet connection.',
  connection: 'Network error. Please check your internet connection.',
  timeout: 'The server took too long to respond. Please try again.',
  'Daily Focus Limit Reached': 'Daily limit reached (100/100). Rest now, founder.',
  TypeError: 'Something went wrong within the app. Please restart it.',
  ReferenceError: 'Something went wrong within the app. Please restart it.',
};

export const getUserFriendlyErrorMessage = (error: any): string => {
  if (!error) return 'An unknown error occurred.';

  const message = typeof error === 'string' ? error : error.message || '';
  const code = error.code || '';

  // 1. Check Exact Code Match
  if (code && ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code];
  }

  // 2. Check Substring Match from Dictionary
  for (const [key, friendlyMsg] of Object.entries(ERROR_MESSAGES)) {
    if (message.includes(key)) {
      return friendlyMsg;
    }
  }

  // 3. Fallback
  if (message && message.length < 100) {
    return message;
  }

  return 'An unexpected error occurred. Please try again later.';
};
