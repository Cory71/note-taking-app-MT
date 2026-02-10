// Main index route for the app (home page and health check)
import express from 'express';

import { ensureAuthPage } from '../middleware/ensureAuth.js';

const router = express.Router();

// Responds with 'OK' to confirm the server is running
router.get('/', (req, res) => {
  res.send('OK');
});

// Simple protected route to confirm auth middleware works
router.get('/protected', ensureAuthPage, (req, res) => {
  res.send('You are logged in.');
});

export default router;
