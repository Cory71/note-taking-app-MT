// Auth controller (register/login/logout)
import bcrypt from 'bcrypt';

import User from '../models/User.js';

// --- Input helpers ---
function safeTrim(value) {
  if (!value) {
    return '';
  }

  return value.trim();
}

function normalizeEmail(email) {
  return safeTrim(email);
}

function normalizeUsername(username) {
  return safeTrim(username);
}

function getEmailLower(email) {
  return email.toLowerCase();
}

function getUsernameLower(username) {
  return username.toLowerCase();
}

// --- Validation helpers ---
function validateUsername(username) {
  if (!username) {
    return 'Username is required.';
  }

  if (username.length < 3 || username.length > 30) {
    return 'Username must be between 3 and 30 characters.';
  }

  if (!/^[A-Za-z0-9_]+$/.test(username)) {
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

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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

  if (!/[A-Za-z0-9]/.test(password)) {
    return 'Password must include at least one letter or one number.';
  }

  return '';
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

function getLoginErrorMessage(query) {
  if (!query?.error) {
    return '';
  }

  return 'Invalid username/email or password.';
}

// --- Controllers ---
export function showRegister(req, res) {
  res.render('auth/register', buildRegisterViewModel({}));
}

export function showLogin(req, res) {
  const error = getLoginErrorMessage(req.query);
  res.render('auth/login', buildLoginViewModel({ error }));
}

export async function handleRegister(req, res, next) {
  try {
    const username = normalizeUsername(req.body.username);
    const email = normalizeEmail(req.body.email);
    const password = req.body.password || '';

    const usernameError = validateUsername(username);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    const errorMessage = usernameError || emailError || passwordError;

    if (errorMessage) {
      return res
        .status(400)
        .render('auth/register', buildRegisterViewModel({ error: errorMessage, username, email }));
    }

    const usernameLower = getUsernameLower(username);
    const emailLower = getEmailLower(email);

    const existingUser = await User.findOne({
      $or: [{ usernameLower }, { emailLower }],
    });

    if (existingUser) {
      return res
        .status(400)
        .render(
          'auth/register',
          buildRegisterViewModel({
            error: 'Username or email already exists.',
            username,
            email,
          })
        );
    }

    const passwordHash = await bcrypt.hash(password, 10);

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
        return res
          .status(400)
          .render(
            'auth/register',
            buildRegisterViewModel({
              error: 'Username or email already exists.',
              username,
              email,
            })
          );
      }

      throw error;
    }

    req.login(newUser, (error) => {
      if (error) {
        return next(error);
      }

      return res.redirect('/');
    });
  } catch (error) {
    return next(error);
  }
}

export function handleLogout(req, res, next) {
  req.logout((error) => {
    if (error) {
      return next(error);
    }

    return res.redirect('/');
  });
}
