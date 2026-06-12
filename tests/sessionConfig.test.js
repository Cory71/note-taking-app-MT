// Tests for session store fallback and proxy trust (Mocha + Chai)
import { before, describe, it } from 'mocha';
import { expect } from 'chai';

let app;
let buildSessionStore;

// app.js requires SESSION_SECRET at import time; provide it before importing.
before(async () => {
  process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test_session_secret';
  delete process.env.MONGODB_URI; // Ensure the no-DB fallback path is exercised.
  const imported = await import('../app.js');
  app = imported.default;
  buildSessionStore = imported.buildSessionStore;
});

describe('Session configuration', () => {
  it('trusts the first proxy hop (needed for secure cookies on Render)', () => {
    expect(app.get('trust proxy')).to.equal(1);
  });

  it('uses no custom store (memory fallback) when MONGODB_URI is unset', () => {
    expect(buildSessionStore(undefined)).to.equal(undefined);
    expect(buildSessionStore('')).to.equal(undefined);
  });
});
