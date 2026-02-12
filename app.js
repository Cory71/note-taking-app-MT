// Express app setup and core middleware
import path from 'path';
import express from 'express';
import session from 'express-session';
import passport from 'passport';

import './passport.js';
import authRoutes from './routes/authRoutes.js';
import indexRoutes from './routes/indexRoutes.js';
import noteApiRoutes from './routes/noteApiRoutes.js';

const app = express();

// --- Sessions + Passport setup helpers ---
function getRequiredEnvVar(name) {
	const value = process.env[name];

	if (!value) {
		throw new Error(`Missing ${name}. Add it to your .env file.`);
	}

	return value;
}

function buildSessionOptions() {
	const sessionSecret = getRequiredEnvVar('SESSION_SECRET');

	return {
		secret: sessionSecret,
		resave: false,
		saveUninitialized: false,
		cookie: {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
		},
	};
}

function configureSessions(appInstance) {
	appInstance.use(session(buildSessionOptions()));
}

function configurePassport(appInstance) {
	appInstance.use(passport.initialize());
	appInstance.use(passport.session());
}

// View engine setup (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public'));

// Sessions + Passport
configureSessions(app);
configurePassport(app);

app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/api/notes', noteApiRoutes);

export default app;


