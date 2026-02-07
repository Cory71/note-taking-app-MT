// Basic integration test for Express app root route (Mocha + Chai)
import { describe, it } from 'mocha';
import { expect } from 'chai';

import app from '../app.js';

describe('GET /', () => {
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
