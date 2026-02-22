// Basic integration test for Express app root route (Mocha + Chai)
import { before, describe, it } from 'mocha';
import { expect } from 'chai';

let app;

// App requires SESSION_SECRET to be set (Phase 3).
// With ESM, static imports run before this file executes, so we dynamically import.
before(async () => {
  process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test_session_secret'; // Provide required env for app startup.
  const imported = await import('../app.js');
  app = imported.default; // Load app after setting required env var.
});

describe('Server root route', () => {
  it('renders the home page', async () => {
    // Start the app on a random available port
    const server = app.listen(0);

    try {
      // Get the port and make a request to the root route
      const { port } = server.address();
      const response = await fetch(`http://127.0.0.1:${port}/`);

      // Check that the response is 200 and includes the home page heading
      expect(response.status).to.equal(200);
      const html = await response.text();
      expect(html).to.include('Note Taking App'); // Confirm expected home page content.
    } finally {
      // Always close the server after the test
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
