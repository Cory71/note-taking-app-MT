// Auth routes (register, login, logout)
import express from 'express';
import passport from 'passport';

import { handleLogout, handleRegister, showLogin, showRegister } from '../controllers/authController.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// Registration routes
router.get('/register', showRegister); // Show register page.
router.post('/register', authLimiter, handleRegister); // Submit register form (rate limited).

// Login routes
router.get('/login', showLogin); // Show login page.
router.post(
  '/login',
  authLimiter, // Slow down repeated login attempts (credential stuffing).
  passport.authenticate('local', {
    failureRedirect: '/login?error=1', // Re-open login page when credentials fail.
    successRedirect: '/notes', // Go to notes on success.
  })
);

// Auth0 routes
router.get(
  '/auth/auth0',
  authLimiter, // Limit how often the Auth0 flow can be started.
  passport.authenticate('auth0', {
    scope: 'openid email profile',
    prompt: 'login', // Always show provider login prompt.
  })
);
router.get(
  '/auth/auth0/callback',
  passport.authenticate('auth0', {
    failureRedirect: '/login?error=1', // Send user back to login if Auth0 fails.
    successRedirect: '/notes', // Go to notes after Auth0 login.
  })
);

// Logout route
router.post('/logout', handleLogout); // End current user session.

export default router;
