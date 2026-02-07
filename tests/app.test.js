// Basic integration test for Express app root route
import test from 'node:test';
import assert from 'node:assert/strict';

import app from '../app.js';

// Test: the root route should return 'OK'
test('GET / returns OK', async () => {
  // Start the app on a random available port
  const server = app.listen(0);

  try {
    // Get the port and make a request to the root route
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/`);

    // Check that the response is 200 OK and the body is 'OK'
    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'OK');
  } finally {
    // Always close the server after the test
    await new Promise((resolve) => server.close(resolve));
  }
});
