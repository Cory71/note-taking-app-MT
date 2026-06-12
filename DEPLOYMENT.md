# Deployment Guide — MongoDB Atlas + Render

This guide deploys the note-taking app to Render using MongoDB Atlas for the
database and session storage. It starts with an empty database (no data
migration).

## 1. Create a MongoDB Atlas database

1. Sign up at https://www.mongodb.com/cloud/atlas and create a **free (M0)** cluster.
2. **Database Access** → Add New Database User → create a username and password
   (save them). Give it "Read and write to any database".
3. **Network Access** → Add IP Address → **Allow access from anywhere**
   (`0.0.0.0/0`). Render's free-tier outbound IPs are not fixed, so this is
   required.
4. **Database** → **Connect** → **Drivers** → copy the connection string. It
   looks like:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority`
5. Insert your password and add the database name before the `?`:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/note-taking-app-mt?retryWrites=true&w=majority`

## 2. Deploy to Render

1. Push this repository to GitHub (do not commit `.env`).
2. At https://render.com → **New** → **Web Service** → connect the GitHub repo.
3. Settings:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
4. Add **Environment Variables** (Environment tab):
   - `MONGODB_URI` = the Atlas string from step 1.5
   - `SESSION_SECRET` = a long random string (e.g. `openssl rand -hex 32`)
   - `NODE_ENV` = `production`
   - `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` = from Auth0
   - `AUTH0_CALLBACK_URL` = `https://<your-app>.onrender.com/auth/auth0/callback`
   - (Do **not** set `PORT`; Render provides it automatically.)
5. Create the service. Render builds and gives you a URL like
   `https://<your-app>.onrender.com`.

## 3. Finish Auth0 setup

> **Important:** The Auth0 application must be a **Regular Web Application** (not a
> Single Page App). This app uses server-side login (`passport-auth0`), which
> authenticates the token exchange with the client secret. A SPA-type app will fail
> the Auth0 callback with `access_denied`. Also make sure `AUTH0_CLIENT_SECRET`
> exactly matches the value shown in the Auth0 application settings.

1. In the Auth0 dashboard → your application → **Settings**.
2. Confirm **Application Type** is **Regular Web Application**.
3. Add to **Allowed Callback URLs**:
   `https://<your-app>.onrender.com/auth/auth0/callback`
4. Add to **Allowed Logout URLs** and **Allowed Web Origins**:
   `https://<your-app>.onrender.com`
5. Save changes.

## 4. Verify the live app

1. Open the Render URL. Register a new account and create a note.
2. Log out and log back in (local and "Log in with Auth0").
3. In Render, trigger a manual deploy or wait for the free tier to sleep and
   wake; log in again and confirm your session/account still works (sessions are
   stored in Atlas, so they survive restarts).

## Notes

- The free Render tier sleeps after ~15 minutes idle; the first request after
  sleep takes a few seconds to wake.
- Sessions and notes both live in MongoDB Atlas; the in-memory session store is
  used only when `MONGODB_URI` is unset (local development without it).
