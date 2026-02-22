// Auth middleware helpers for pages and API routes

function isLoggedIn(req) {
  return req.isAuthenticated && req.isAuthenticated(); // Passport sets this when a session is active.
}

// Redirect to login when the user is not authenticated
export function ensureAuthPage(req, res, next) {
  if (isLoggedIn(req)) {
    return next(); // Let page request continue for logged-in users.
  }

  return res.redirect('/login'); // Send guests to login page.
}

// Return JSON 401 when the user is not authenticated
export function ensureAuthApi(req, res, next) {
  if (isLoggedIn(req)) {
    return next(); // Let API request continue for logged-in users.
  }

  return res.status(401).json({ error: { message: 'Not authenticated.' } }); // APIs return JSON errors.
}
