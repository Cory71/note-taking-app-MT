// Tests that the home page template renders in both auth states (Mocha + Chai)
import { describe, it } from 'mocha';
import { expect } from 'chai';

import path from 'path';
import ejs from 'ejs';

// Render the real home view the same way Express does (includes resolve from /views).
const indexView = path.join(process.cwd(), 'views', 'index.ejs');

describe('Home page rendering', () => {
  it('renders for a logged-in user without throwing', async () => {
    // Regression: index.ejs included the nav partial without passing
    // hideMyNotesNavButton, which crashed for logged-in users.
    const html = await ejs.renderFile(indexView, {
      currentUser: { username: 'tester' },
    });

    expect(html).to.include('Welcome, tester'); // Logged-in nav greeting.
    expect(html).to.include('/notes'); // "All Notes" button is shown on the home page.
  });

  it('renders for a guest without throwing', async () => {
    const html = await ejs.renderFile(indexView, { currentUser: null });

    expect(html).to.include('Log In'); // Guest call-to-action.
  });
});
