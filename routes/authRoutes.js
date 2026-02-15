// Auth routes (register, login, logout)
import express from 'express';
import passport from 'passport';

import { handleLogout, handleRegister, showLogin, showRegister } from '../controllers/authController.js';

const router = express.Router();

// Registration routes
router.get('/register', showRegister);
router.post('/register', handleRegister);

// Login routes
router.get('/login', showLogin);
router.post(
  '/login',
  passport.authenticate('local', {
    failureRedirect: '/login?error=1',
    successRedirect: '/',
  })
);

// Auth0 routes
router.get(
  '/auth/auth0',
  passport.authenticate('auth0', {
    scope: 'openid email profile',
    prompt: 'login',
  })
);
router.get(
  '/auth/auth0/callback',
  passport.authenticate('auth0', {
    failureRedirect: '/login?error=1',
    successRedirect: '/',
  })
);

// Logout route
router.post('/logout', handleLogout);

export default router;
