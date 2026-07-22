/**
 * A minimal pub/sub so the plain `api.ts` module (no React context available)
 * can tell AuthProvider "the access token was rejected" without importing
 * React context directly. AuthProvider registers the real handler; api.ts
 * only ever calls `notifyUnauthorized()`.
 */

type Handler = () => void;

let handler: Handler | null = null;
let firing = false;

export function setUnauthorizedHandler(fn: Handler | null) {
  handler = fn;
}

/** Called by api.ts whenever an authenticated request comes back 401. */
export function notifyUnauthorized() {
  if (firing) return; // avoid a burst of parallel 401s triggering the handler repeatedly
  firing = true;
  handler?.();
  setTimeout(() => {
    firing = false;
  }, 1000);
}
