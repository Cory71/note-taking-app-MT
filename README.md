# Note-Taking App (Mid-Term)

A full-stack note-taking app built with Node.js, Express, MongoDB, EJS, and Passport authentication (Local strategy + optional Auth0).

## Project Planning (Kanban)

- GitHub Projects board: <https://github.com/users/Cory71/projects/3>

## Features

- User accounts with login/logout (Passport Local)
- Optional third-party login with Auth0 (Passport Auth0)
- Notes CRUD (create, read, update, delete)
- Authorization: users can only access their own notes
- Server-side validation with clear error messages
- Simple EJS UI for managing notes
- REST API at `/api/notes` for grading/testing

## Tech Stack

- Runtime: Node.js
- Server: Express
- DB: MongoDB + Mongoose
- Views: EJS
- Auth: Passport (`passport-local`, optional `passport-auth0`)
- Tests: Mocha + Chai

## Project Structure (MVC)

- `server.js`: loads env, connects MongoDB, starts the server
- `app.js`: configures Express middleware, sessions, Passport, and routes
- `routes/`: route definitions (pages + API)
- `controllers/`: request handlers (page controllers + API controllers)
- `models/`: Mongoose models (`User`, `Note`)
- `views/`: EJS pages + partials
- `public/`: CSS and browser JS

## Setup (Local)

### Prerequisites

- A running MongoDB instance (local or cloud)
- Node.js installed (a recent LTS version that supports ES Modules)

### Install

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root (use `.env.example` as a template).

Required:

- `MONGODB_URI` - Mongo connection string for the app (local MongoDB or MongoDB Atlas)
- `SESSION_SECRET` - a long random string used to sign session cookies (keep this private)

`MONGODB_URI` example (local MongoDB):

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/note-taking-app-mt
```

Generating a `SESSION_SECRET` (examples):

```bash
# Node.js (works on Windows/macOS/Linux)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```bash
# OpenSSL (if installed)
openssl rand -hex 32
```

Notes:

- Do not commit `.env` to git.
- If `SESSION_SECRET` changes, existing login sessions will be invalidated.

Optional:

- `PORT` - defaults to `3000` if not set
- `MONGODB_URI_TEST` - Mongo connection string for tests (recommended)

Auth0 (optional — only needed if you want Auth0 login enabled):

- `AUTH0_DOMAIN`
- `AUTH0_CLIENT_ID`
- `AUTH0_CLIENT_SECRET`
- `AUTH0_CALLBACK_URL` (default used in `.env.example`: `http://localhost:3000/auth/auth0/callback`)

### Run

```bash
npm start
```

Then open:

- `http://localhost:3000/`

## Tests

```bash
npm test
```

Notes:

- Tests connect to a *separate* database using `MONGODB_URI_TEST` (so test data does not affect your main `MONGODB_URI` database).
- If `MONGODB_URI_TEST` is not set, tests default to `mongodb://127.0.0.1:27017/note-taking-app-mt-test`.
- The test suite drops the test database after it runs (cleanup).
- Your MongoDB server must be running for tests to pass.

## Routes

### UI (EJS Pages)

These routes are intended for normal browser use. Most `/notes` routes require login.

- `GET /` - home page
- `GET /register` - registration page
- `POST /register` - register a new user
- `GET /login` - login page
- `POST /login` - login (Passport Local)
- `POST /logout` - logout

Login details (Local Strategy):

- Form fields: `usernameOrEmail` and `password`
- `usernameOrEmail` can be either a username or an email (case-insensitive)

Notes pages (protected by `ensureAuthPage`):

- `GET /notes` - list notes + create form
- `GET /notes/:id/edit` - edit note page
- `POST /notes` - create note (form submit)
- `POST /notes/:id` - update note (form submit)
- `POST /notes/:id/delete` - delete note (form submit)
- `POST /notes/:id/pin` - toggle pin/unpin
- `POST /notes/reorder` - save pinned note order (JSON response)

Auth0 (optional):

- `GET /auth/auth0` - start Auth0 login
- `GET /auth/auth0/callback` - Auth0 callback

### REST API (JSON)

Base path: `/api/notes`

All API endpoints are protected by `ensureAuthApi` and require an authenticated session.

- If not authenticated, the API returns:

```json
{ "error": { "message": "Not authenticated." } }
```

#### Note JSON shape

A note returned from the API is a MongoDB document that includes (typical fields):

- `_id`
- `userId`
- `title`
- `content`
- `isPinned`
- `order`
- `createdAt`
- `updatedAt`

#### Validation rules

- `title` is required
- `title` max length: 200
- `content` max length: 5000
- `title` and `content` are trimmed server-side

On validation failure, the API responds with status `400` and:

```json
{ "error": { "message": "<validation message>" } }
```

#### Error response format

All API errors use this shape:

```json
{ "error": { "message": "..." } }
```

Common status codes:

- `400` invalid input
- `401` not authenticated
- `403` not authorized (not the note owner)
- `404` not found (includes invalid ObjectId ids, normalized to 404)
- `500` server error

---

### `GET /api/notes`

List notes for the logged-in user.

Response `200`:

```json
{ "notes": [ { "_id": "...", "title": "...", "content": "..." } ] }
```

---

### `GET /api/notes/:id`

Fetch one note by id (must belong to the logged-in user).

Response `200`:

```json
{ "note": { "_id": "...", "title": "...", "content": "..." } }
```

Response `403` (not owner):

```json
{ "error": { "message": "You do not have access to this note." } }
```

Response `404`:

```json
{ "error": { "message": "Note not found." } }
```

---

### `POST /api/notes`

Create a note.

Headers:

- `Content-Type: application/json`

Request body:

```json
{ "title": "My note", "content": "Some text" }
```

Response `201`:

```json
{ "note": { "_id": "...", "title": "My note", "content": "Some text" } }
```

---

### `PUT /api/notes/:id`

Update an existing note (must belong to the logged-in user).

Headers:

- `Content-Type: application/json`

Request body:

```json
{ "title": "Updated title", "content": "Updated text" }
```

Response `200`:

```json
{ "note": { "_id": "...", "title": "Updated title", "content": "Updated text" } }
```

---

### `DELETE /api/notes/:id`

Delete a note (must belong to the logged-in user).

Response `200`:

```json
{ "message": "Note deleted." }
```

## Example API Calls (curl)

Because the API uses session-based auth, you typically:

1) Register/login in the browser to create a session cookie
2) Use a tool like Postman (with cookies enabled) or curl with a saved cookie jar

Example pattern with curl (replace URLs/ids as needed):

```bash
# 1) Login and save cookies
curl -i -c cookies.txt -X POST http://localhost:3000/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "usernameOrEmail=YOUR_USERNAME_OR_EMAIL&password=YOUR_PASSWORD"

# 2) Call the API with the session cookies
curl -s -b cookies.txt http://localhost:3000/api/notes
```

## Important Developer Notes

- The app expects `SESSION_SECRET` to be set; `app.js` throws an error if it is missing.
- Auth0 is enabled only when all Auth0 env vars are present.

## Reflection (Development Notes + Lessons Learned)

### What went well

- **Planning first helped a lot.** I used a small phased plan (see `documents/Planning.md`) and a Kanban board to avoid getting stuck and to keep the work split into manageable tasks.
- **MVC kept the app readable.** Keeping routes thin and moving logic into controllers made it easier to debug and to add features without rewriting everything.
- **Shared validation reduced bugs.** Using the same note normalization + validation rules for both the EJS forms and the JSON API helped keep behavior consistent.
- **Authorization is enforced server-side.** Ownership checks ensure users can only read/update/delete their own notes, which is a real-world requirement even for a simple app.

### Challenges

- **Session-based API testing.** Because the API uses login sessions (cookies), API testing requires logging in first and then sending requests with saved cookies.
- **Handling invalid MongoDB ids.** Invalid ObjectId values can throw CastErrors; normalizing those to a clean `404` response makes the API/UI feel more predictable.
- **Keeping UI and API behavior consistent.** The UI uses redirects + rendered EJS pages, while the API uses JSON + status codes; it took extra care to keep validation rules and ownership checks identical in both places.
- **Ordering pinned notes.** Designing a sort order that feels natural (pinned notes first with manual drag order, then unpinned newest-first) required thinking through how to store and query `order` without making the code too complex.
- **Duplicate user handling (race conditions).** Even after checking for an existing user, MongoDB can still throw a duplicate key error if two registrations happen at nearly the same time; catching `11000` errors and returning a friendly message improved reliability.
- **Auth0 being optional.** Making Auth0 “plug in when configured” meant the app had to behave correctly both with and without those environment variables set.

### What I learned

- How Passport’s session auth works end-to-end (serialize/deserialize, `req.isAuthenticated()`, protecting page vs API routes).
- Why consistent error shapes (`{ error: { message } }`) make client behavior and grading/testing easier.
- How basic automated tests (Mocha/Chai) can quickly verify validation + ownership rules.
- How separating concerns (routes → controllers → shared helpers) makes debugging and future changes much easier.
- How to model real constraints in Mongoose (required fields, max lengths, timestamps, and indexed fields for queries/sorting).
- How to build simple Express middleware that behaves differently for pages (redirect) vs APIs (JSON 401) without duplicating logic.
- Why server-side validation is still required even when client-side validation exists (clients can bypass browser checks).
- Why secrets must live in environment variables, and how `.env.example` helps document required configuration without leaking credentials.

### Biggest takeaways

- Breaking the project into small steps (plan → build → test) made it much easier to finish without feeling too overwhelmed.
- Doing validation and authorization on the server made the app safer and more reliable.
