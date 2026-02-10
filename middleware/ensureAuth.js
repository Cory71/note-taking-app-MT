// Auth middleware helpers for pages and API routes

function isLoggedIn(req) {
  return req.isAuthenticated && req.isAuthenticated();
}

// Redirect to login when the user is not authenticated
export function ensureAuthPage(req, res, next) {
  if (isLoggedIn(req)) {
    return next();
  }

  return res.redirect('/login');
}

// Return JSON 401 when the user is not authenticated
export function ensureAuthApi(req, res, next) {
  if (isLoggedIn(req)) {
    return next();
  }

  return res.status(401).json({ error: { message: 'Not authenticated.' } });
}
