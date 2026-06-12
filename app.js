// Express app setup and core middleware
import path from 'path';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import MongoStore from 'connect-mongo';

import './passport.js';
import authRoutes from './routes/authRoutes.js';
import indexRoutes from './routes/indexRoutes.js';
import noteApiRoutes from './routes/noteApiRoutes.js';
import noteRoutes from './routes/noteRoutes.js';

const app = express();

// Render terminates HTTPS at its proxy and forwards plain HTTP. Trusting the
// first proxy hop lets Express know the original request was secure, so the
// secure session cookie is set correctly in production.
app.set('trust proxy', 1);

// --- Sessions + Passport setup helpers ---
function getRequiredEnvVar(name) {
	const value = process.env[name];

	if (!value) {
		throw new Error(`Missing ${name}. Add it to your .env file.`);
	}

	return value; // Return the env value once validated.
}

// Build a MongoDB-backed session store so logins survive restarts.
// Returns undefined when no database is configured, which makes
// express-session fall back to its default in-memory store (used locally
// and in tests).
export function buildSessionStore(mongoUri) {
	if (!mongoUri) {
		return undefined;
	}

	return MongoStore.create({ mongoUrl: mongoUri }); // Store sessions in MongoDB.
}

function buildSessionOptions() {
	const sessionSecret = getRequiredEnvVar('SESSION_SECRET'); // Keep session secret in env, not code.

	return {
		secret: sessionSecret,
		store: buildSessionStore(process.env.MONGODB_URI), // Persist sessions in MongoDB when configured.
		resave: false,
		saveUninitialized: false,
		cookie: {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production', // Use secure cookie only in production (HTTPS).
		},
	};
}

function configureSessions(appInstance) {
	appInstance.use(session(buildSessionOptions())); // Turn on login session support.
}

function configurePassport(appInstance) {
	appInstance.use(passport.initialize()); // Enable Passport on every request.
	appInstance.use(passport.session()); // Read logged-in user from the session.
}

// View engine setup (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

app.use(express.urlencoded({ extended: false })); // Read form POST data.
app.use(express.json()); // Read JSON request bodies.
app.use(express.static('public')); // Serve browser files like CSS and JS.

// Sessions + Passport
configureSessions(app);
configurePassport(app);

app.use('/', indexRoutes); // Home and simple page routes.
app.use('/', authRoutes); // Register/login/logout routes.
app.use('/', noteRoutes); // Notes page/form routes.
app.use('/api/notes', noteApiRoutes); // JSON API routes for notes.

// --- Global error handler (friendly messages) ---
function isApiRequest(req) {
	return req.originalUrl?.startsWith('/api/'); // Route API errors to JSON responses.
}

function sendApiError(res, statusCode, message) {
	return res.status(statusCode).json({ error: { message } });
}

function sendPageError(res, statusCode, message) {
	return res.status(statusCode).send(message);
}

app.use((error, req, res, next) => {
	if (!error) {
		return next();
	}

	console.error('Unexpected error:', error);

	if (isApiRequest(req)) {
		return sendApiError(res, 500, 'Server error. Please try again.');
	}

	return sendPageError(res, 500, 'Server error. Please try again.');
});

export default app;


