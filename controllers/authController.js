// Auth controller (register/login/logout)
import bcrypt from 'bcrypt';

import User from '../models/User.js';

// --- Input helpers ---
function safeTrim(value) {
  if (!value) {
    return ''; // Normalize missing input to an empty string.
  }

  return value.trim(); // Remove extra spaces from both ends.
}

function toLower(value) {
  return value.toLowerCase(); // Make text lowercase for matching.
}

// --- Validation helpers ---
function validateUsername(username) {
  if (!username) {
    return 'Username is required.';
  }

  if (username.length < 3 || username.length > 30) {
    return 'Username must be between 3 and 30 characters.';
  }

  if (!/^[A-Za-z0-9_]+$/.test(username)) { // Allow only letters, numbers, and underscore.
    return 'Username can use letters, numbers, and underscore only.';
  }

  return '';
}

function validateEmail(email) {
  if (!email) {
    return 'Email is required.';
  }

  if (email.length > 100) {
    return 'Email must be 100 characters or less.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { // Quick email format check.
    return 'Email must be a valid address.';
  }

  return '';
}

function validatePassword(password) {
  if (!password) {
    return 'Password is required.';
  }

  if (password.length < 6) {
    return 'Password must be at least 6 characters long.';
  }

  if (!/[A-Za-z]/.test(password)) { // Require at least one letter.
    return 'Password must include at least one letter.';
  }

  if (!/[0-9]/.test(password)) { // Require at least one number.
    return 'Password must include at least one number.';
  }

  return '';
}

function getRegisterValidationError({ username, email, password }) {
  return validateUsername(username) || validateEmail(email) || validatePassword(password); // Return the first validation error found.
}

// --- View helpers ---
function buildRegisterViewModel({ error = '', username = '', email = '' }) {
  return {
    error,
    values: {
      username,
      email,
    },
  };
}

function buildLoginViewModel({ error = '', usernameOrEmail = '' }) {
  return {
    error,
    values: {
      usernameOrEmail,
    },
  };
}

function renderRegisterError(res, { error, username, email }) {
  return res.status(400).render('auth/register', buildRegisterViewModel({ error, username, email })); // Re-show form with message.
}

function getLoginErrorMessage(query) {
  if (!query?.error) {
    return '';
  }

  return 'Invalid username/email or password.'; // Keep auth errors generic for safety.
}

// --- Controllers ---
export function showRegister(req, res) {
  res.render('auth/register', buildRegisterViewModel({})); // Render an empty register form model.
}

export function showLogin(req, res) {
  const error = getLoginErrorMessage(req.query); // Convert URL error flag into user-friendly text.
  res.render('auth/login', buildLoginViewModel({ error }));
}

export async function handleRegister(req, res, next) {
  try {
    const username = safeTrim(req.body.username);
    const email = safeTrim(req.body.email);
    const password = req.body.password || '';

    const errorMessage = getRegisterValidationError({ username, email, password }); // Validate before any database calls.

    if (errorMessage) {
      return renderRegisterError(res, { error: errorMessage, username, email });
    }

    const usernameLower = toLower(username); // Used for case-insensitive username checks.
    const emailLower = toLower(email); // Used for case-insensitive email checks.

    const existingUser = await User.findOne({
      $or: [{ usernameLower }, { emailLower }],
    });

    if (existingUser) {
      return renderRegisterError(res, {
        error: 'Username or email already exists.', // Clear message for duplicate account.
        username,
        email,
      });
    }

    const passwordHash = await bcrypt.hash(password, 10); // Never store plain-text passwords.

    let newUser;

    try {
      newUser = await User.create({
        username,
        usernameLower,
        email,
        emailLower,
        passwordHash,
      });
    } catch (error) {
      // If two people register at the same time, MongoDB may return a duplicate key error.
      if (error && error.code === 11000) {
        return renderRegisterError(res, {
          error: 'Username or email already exists.',
          username,
          email,
        });
      }

      throw error;
    }

    req.login(newUser, (error) => { // Start an authenticated session after registration.
      if (error) {
        return next(error);
      }

      return res.redirect('/notes');
    });
  } catch (error) {
    return next(error); // Let global error handler respond.
  }
}

export function handleLogout(req, res, next) {
  req.logout((error) => { // End the current login session.
    if (error) {
      return next(error);
    }

    return res.redirect('/');
  });
}
