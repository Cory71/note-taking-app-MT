// Passport configuration (Local Strategy)
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';

import User from './models/User.js';

// Normalize a login value for case-insensitive lookup
function toLowerTrimmed(value) {
  if (!value) {
    return '';
  }

  return value.trim().toLowerCase();
}

// Find a user by username or email (lowercased)
async function findUserByLogin(loginLower) {
  return User.findOne({
    $or: [{ usernameLower: loginLower }, { emailLower: loginLower }],
  });
}

// Verify a login attempt using the local strategy
async function verifyLocalUser(usernameOrEmail, password, done) {
  try {
    const loginLower = toLowerTrimmed(usernameOrEmail);

    if (!loginLower) {
      return done(null, false, { message: 'Missing login value.' });
    }

    const user = await findUserByLogin(loginLower);

    if (!user || !user.passwordHash) {
      return done(null, false, { message: 'Invalid credentials.' });
    }

    const matches = await bcrypt.compare(password, user.passwordHash);

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

// Store user id in session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Restore user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});
