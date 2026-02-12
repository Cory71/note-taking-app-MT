// Basic integration test for Express app root route (Mocha + Chai)
import { before, describe, it } from 'mocha';
import { expect } from 'chai';

let app;

// App requires SESSION_SECRET to be set (Phase 3).
// With ESM, static imports run before this file executes, so we dynamically import.
before(async () => {
  process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test_session_secret';
  const imported = await import('../app.js');
  app = imported.default;
});

describe('Server root route', () => {
  it('returns OK', async () => {
    // Start the app on a random available port
    const server = app.listen(0);

    try {
      // Get the port and make a request to the root route
      const { port } = server.address();
      const response = await fetch(`http://127.0.0.1:${port}/`);

      // Check that the response is 200 OK and the body is 'OK'
      expect(response.status).to.equal(200);
      expect(await response.text()).to.equal('OK');
    } finally {
      // Always close the server after the test
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
