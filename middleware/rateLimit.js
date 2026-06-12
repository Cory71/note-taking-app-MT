// Rate limiters to slow down automated abuse (account spam, scripted API calls).
// Limits are intentionally generous so a real person exploring the app never hits them.
import rateLimit from 'express-rate-limit';

const FIFTEEN_MINUTES = 15 * 60 * 1000; // Rolling window length for all limiters.

// Friendly message shown to a browser when an auth limit is hit.
const AUTH_LIMIT_MESSAGE = 'Too many attempts from your network. Please wait a few minutes and try again.';

// JSON error sent when the API limit is hit (matches the app's API error shape).
function sendApiLimitError(req, res) {
  res.status(429).json({
    error: { message: 'Too many requests. Please slow down and try again shortly.' },
  });
}

// Limit repeated auth attempts (register, login, Auth0 start) to curb account spam
// and credential stuffing. ~20 attempts per 15 minutes per IP is far above normal use.
export const authLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 20,
  standardHeaders: true, // Send RateLimit-* headers so clients can see limits.
  legacyHeaders: false,
  message: AUTH_LIMIT_MESSAGE,
});

// Limit the JSON API to stop scripted bulk calls. ~100 requests per 15 minutes per IP
// is plenty for a person browsing and editing notes.
export const apiLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: sendApiLimitError,
});
