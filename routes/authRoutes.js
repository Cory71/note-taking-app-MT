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

// Logout route
router.post('/logout', handleLogout);

export default router;
