const CODE_MESSAGES = {
  CSRF_INIT_FAILED: 'Refresh the page and try again.',
  CSRF_VALIDATION_FAILED: 'Refresh the page and try again.',
  EMAIL_TAKEN: 'That email is already registered.',
  EMAIL_NOT_VERIFIED:
  'Confirm your email address before signing in.',
  EMAIL_CONFIRMATION_INVALID:
    'This email confirmation link is invalid or has expired.',
  EMAIL_CONFIRMATION_COOLDOWN:
    'Please wait one minute before requesting another confirmation email.',
  EMAIL_CHANGE_REQUIRES_VERIFICATION:
    'Use the email confirmation form to change your email address.',
  EMAIL_UNCHANGED:
    'Enter a different email address.',
  INVALID_PASSWORD:
    'Your current account password is incorrect.',
  FORBIDDEN: 'You do not have permission to do that.',
  GAME_ACCESS_REQUIRED: 'This game is not available in your library.',
  GAME_NOT_FOUND: 'That game could not be found.',
  INVALID_CREDENTIALS: 'Email or password is incorrect.',
  INVALID_PASSWORD: 'Current password is incorrect.',
  INVALID_RESPONSE: 'Something went wrong. Try again later.',
  INVALID_REQUEST: 'Check the fields and try again.',
  INVALID_REQUEST_PATH: 'Something went wrong. Try again later.',
  INVALID_TOKEN: 'This link is invalid or has expired.',
  INVALID_TOTP: 'Invalid 2FA code.',
  NETWORK_ERROR: 'Could not connect. Check your internet.',
  NEWSLETTER_LINK_INVALID: 'This newsletter link is invalid or expired.',
  NOT_FOUND: 'This page or action could not be found.',
  PAYLOAD_TOO_LARGE: 'That file or request is too large.',
  PROFILE_NOT_FOUND: 'Profile not found.',
  RATE_LIMITED: 'Too many attempts. Try again shortly.',
  RECAPTCHA_FAILED: 'Please complete the security check.',
  RECAPTCHA_REQUIRED: 'Please complete the security check.',
  RECAPTCHA_UNAVAILABLE: 'Security verification is unavailable.',
  REQUEST_TIMEOUT: 'The server took too long. Try again.',
  SAVE_CONFLICT: 'A newer cloud save is available.',
  SAVE_INVALID: 'The save file could not be read.',
  SAVE_NOT_FOUND: 'No cloud save was found.',
  SAVE_TOO_LARGE: 'This save is too large to sync.',
  SERVICE_UNAVAILABLE: 'Service unavailable. Try again later.',
  UNAUTHENTICATED: 'Please sign in to continue.',
  USERNAME_TAKEN: 'That username is already taken.',
  VALIDATION_ERROR: 'Check the fields and try again.',
};

const STATUS_MESSAGES = {
  400: 'Check the fields and try again.',
  401: 'Please sign in to continue.',
  403: 'You do not have permission to do that.',
  404: 'This page or action could not be found.',
  409: 'This action could not be completed.',
  413: 'That file or request is too large.',
  429: 'Too many attempts. Try again shortly.',
  500: 'Something went wrong. Try again later.',
  502: 'Service unavailable. Try again later.',
  503: 'Service unavailable. Try again later.',
};

export function friendlyErrorMessage(error, fallback = 'Something went wrong. Try again later.') {
  const code = String(error?.code || '').toUpperCase();
  if (CODE_MESSAGES[code]) return CODE_MESSAGES[code];
  const status = Number(error?.status || 0);
  if (STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];
  return fallback;
}
