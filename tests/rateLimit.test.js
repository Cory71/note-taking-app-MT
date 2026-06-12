// Tests that the auth rate limiter blocks excessive requests (Mocha + Chai)
import { describe, it } from 'mocha';
import { expect } from 'chai';

import express from 'express';
import { authLimiter } from '../middleware/rateLimit.js';

describe('Rate limiting', () => {
  it('allows normal use but returns 429 once the auth limit is exceeded', async () => {
    // Mount the real authLimiter on a throwaway route so we test the actual config.
    const app = express();
    app.get('/limited', authLimiter, (req, res) => res.send('ok'));

    const server = app.listen(0);

    try {
      const { port } = server.address();
      const url = `http://127.0.0.1:${port}/limited`;

      // The limiter allows 20 requests per window; all of these should pass.
      let lastStatus = 0;
      for (let i = 0; i < 20; i += 1) {
        const res = await fetch(url);
        lastStatus = res.status;
      }
      expect(lastStatus).to.equal(200);

      // The 21st request from the same IP should be blocked.
      const blocked = await fetch(url);
      expect(blocked.status).to.equal(429);

      const body = await blocked.text();
      expect(body).to.include('Too many attempts'); // Friendly limit message.
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
