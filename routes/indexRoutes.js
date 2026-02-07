// Main index route for the app (home page and health check)
import express from 'express';

const router = express.Router();

// Responds with 'OK' to confirm the server is running
router.get('/', (req, res) => {
  res.send('OK');
});

export default router;
