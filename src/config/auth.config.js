/**
 * Auth / token expiry configuration (must match backend JWT_EXPIRES_IN).
 * After this period the user must log in again for security.
 */
export const TOKEN_EXPIRY_HOURS = 5;
export const TOKEN_EXPIRY_MS = TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;

export const AUTH_STORAGE_KEYS = {
  USER: "user",
  TOKEN: "token",
  /** Timestamp (ms) when the token should be considered expired; cleared on logout. */
  TOKEN_EXPIRES_AT: "tokenExpiresAt",
  LOGIN_PAGE_STATE: "LoginPageState",
};
