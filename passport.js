// Passport configuration (Local Strategy + Auth0)
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as Auth0Strategy } from 'passport-auth0';
import bcrypt from 'bcrypt';

import User from './models/User.js';

// Normalize a login value for case-insensitive lookup
function toLowerTrimmed(value) {
  if (!value) {
    return '';
  }

  return value.trim().toLowerCase(); // Make login checks ignore spaces and case.
}

// Find a user by username or email (lowercased)
async function findUserByLogin(loginLower) {
  return User.findOne({
    $or: [{ usernameLower: loginLower }, { emailLower: loginLower }], // Allow username or email login.
  });
}

// Verify a login attempt using the local strategy
async function verifyLocalUser(usernameOrEmail, password, done) {
  try {
    const loginLower = toLowerTrimmed(usernameOrEmail); // Normalize login for case-insensitive lookup.

    if (!loginLower) {
      return done(null, false, { message: 'Missing login value.' });
    }

    const user = await findUserByLogin(loginLower);

    if (!user || !user.passwordHash) {
      return done(null, false, { message: 'Invalid credentials.' }); // Same message avoids leaking account details.
    }

    const matches = await bcrypt.compare(password, user.passwordHash); // Compare plain password to stored hash.

    if (!matches) {
      return done(null, false, { message: 'Invalid credentials.' });
    }

    return done(null, user);
  } catch (error) {
    return done(error);
  }
}

// Local strategy setup
passport.use(
  new LocalStrategy(
    {
      usernameField: 'usernameOrEmail',
      passwordField: 'password',
    },
    verifyLocalUser
  )
);

// --- Auth0 helpers ---
function getAuth0Config() {
  const { AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_CALLBACK_URL } = process.env;

  if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID || !AUTH0_CLIENT_SECRET || !AUTH0_CALLBACK_URL) {
    return null; // Skip Auth0 strategy when env vars are missing.
  }

  return {
    domain: AUTH0_DOMAIN,
    clientID: AUTH0_CLIENT_ID,
    clientSecret: AUTH0_CLIENT_SECRET,
    callbackURL: AUTH0_CALLBACK_URL,
  };
}

function getAuth0Email(profile) {
  return profile?.emails?.[0]?.value || profile?._json?.email || '';
}

function getAuth0Nickname(profile) {
  return profile?.nickname || profile?.displayName || '';
}

function normalizeUsernameBase(value) {
  if (!value) {
    return 'auth0user';
  }

  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') || 'auth0user'; // Keep username simple and safe.
}

async function buildUniqueUsername(base) {
  const cleanedBase = normalizeUsernameBase(base);
  let candidate = cleanedBase;
  let counter = 1;

  while (await User.findOne({ usernameLower: candidate })) {
    counter += 1;
    candidate = `${cleanedBase}${counter}`; // Try next number until username is free.
  }

  return candidate;
}

async function findOrCreateAuth0User(profile) {
  const auth0Id = profile?.id;

  if (!auth0Id) {
    throw new Error('Auth0 profile missing id.');
  }

  const existingUser = await User.findOne({ auth0Id });

  if (existingUser) {
    return existingUser;
  }

  const email = getAuth0Email(profile);

  if (!email) {
    throw new Error('Auth0 profile missing email.');
  }

  const emailLower = email.toLowerCase(); // Save lowercase email for unique matching.
  const existingEmailUser = await User.findOne({ emailLower });

  if (existingEmailUser) {
    existingEmailUser.auth0Id = auth0Id; // Link existing local account to Auth0.
    await existingEmailUser.save();
    return existingEmailUser;
  }

  const usernameBase = getAuth0Nickname(profile) || email.split('@')[0];
  const usernameLower = await buildUniqueUsername(usernameBase);

  return User.create({
    auth0Id,
    username: usernameLower,
    usernameLower,
    email,
    emailLower,
  });
}

async function verifyAuth0User(accessToken, refreshToken, extraParams, profile, done) {
  try {
    const user = await findOrCreateAuth0User(profile);
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}

// Auth0 strategy setup (only when env vars are present)
const auth0Config = getAuth0Config();

if (auth0Config) {
  passport.use(new Auth0Strategy(auth0Config, verifyAuth0User)); // Register Auth0 login only when configured.
}

// Store user id in session
passport.serializeUser((user, done) => {
  done(null, user.id); // Save only user id in session.
});

// Restore user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user); // Rebuild full user object for each request.
  } catch (error) {
    done(error);
  }
});
