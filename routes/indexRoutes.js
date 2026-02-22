// Main index route for the app (home page and health check)
import express from 'express';

import { ensureAuthPage } from '../middleware/ensureAuth.js';

const router = express.Router();

// Render home page
router.get('/', (req, res) => {
  res.render('index', {
    currentUser: req.user || null, // Pass user info to nav/header when logged in.
  });
});

// Simple protected route to confirm auth middleware works
router.get('/protected', ensureAuthPage, (req, res) => {
  res.send('You are logged in.'); // Quick check route for auth middleware.
});

export default router;
