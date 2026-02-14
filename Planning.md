# Planning - Note-Taking App (Mid-Term)

## Goal

Build a full-stack Note-Taking App with:

- Node.js runtime environment
- Express.js back end + REST API
- MongoDB database
- User authentication (Passport Local + Auth0)
- Simple front end (EJS styled with Bootstrap)
- Clear validation + error handling

---

## Key Requirements

- Use MVC folder structure: routes, controllers, models, views, partials (and more if needed)
- Have BOTH `app.js` and `server.js`
- Notes CRUD endpoints: GET, POST, PUT, DELETE
- MongoDB connection uses environment variables
- User authentication: Passport Local Strategy
- Third-party login option: Auth0
- Server-side validation + clear errors
- Front end: plain HTML or EJS (we choose EJS)
- Styling: CSS + Bootstrap
- Port: use `process.env.PORT || 3000` (we chose 3000 default)

---

## Decisions Locked In (so we don’t change later)

- **Front end:** EJS pages using normal **form submits** + redirects (no heavy front-end framework)
- **Notes UI:** simple pages with forms (create/edit/delete) that submit to the server
- **Auth login field:** allow login with **username OR email** (single “usernameOrEmail” input)
- **Username login:** NOT case sensitive (we will compare using a lowercased username)
- **Email login:** NOT case sensitive (we will compare using a lowercased email)
- **Password rules:** at least 6 characters, must include at least **one letter OR one number**, and password is case sensitive
- **Authorization rule:** users can only **CRUD their own notes** (enforced on server)
- **Third-party login:** Auth0 only (meets the requirement with the simplest setup)
- **API requirement:** we will still implement RESTful JSON endpoints at `/api/notes` (GET/POST/PUT/DELETE) for grading/testing.

---

## Route Map (UI Pages vs REST API)

Note:

- UI page routes that require login will be protected by `ensureAuthPage`.
- REST API routes under `/api` will be protected by `ensureAuthApi`.

UI Pages (EJS + form submits):

- `GET /` (home)
- `GET /register`, `GET /login`
- `GET /notes` (list + create form)
- `GET /notes/:id/edit` (edit form)
- `POST /notes` (create)
- `POST /notes/:id` (update)
- `POST /notes/:id/delete` (delete)

REST API (JSON) for requirement/testing:

- `GET /api/notes`
- `GET /api/notes/:id`
- `POST /api/notes`
- `PUT /api/notes/:id`
- `DELETE /api/notes/:id`

---

## Project Structure (MVC)

Suggested folder layout:

- `server.js` (starts server + connects DB)
- `app.js` (configures Express app, middleware, routes)
- `passport.js` (Passport config: Local + Auth0 strategies)
- `middleware/`
  - `ensureAuth.js` (auth helpers: `ensureAuthPage` + `ensureAuthApi`)
- `routes/`
  - `indexRoutes.js` (pages: `GET /`)
  - `authRoutes.js` (login/register/logout + Auth0)
  - `noteRoutes.js` (notes pages: `GET /notes`, `GET /notes/:id/edit`, form submits)
  - `noteApiRoutes.js` (notes CRUD API: `/api/notes`)
- `controllers/`
  - `authController.js`
  - `noteController.js` (note logic; can be shared by pages + API)
- `models/`
  - `User.js`
  - `Note.js`
- `views/`
  - `index.ejs`
  - `auth/`
    - `login.ejs`
    - `register.ejs`
  - `notes/` (notes pages)
    - `index.ejs` (list + create form)
    - `edit.ejs` (edit form)
  - `partials/` (header/nav/footer)
- `public/`
  - `css/styles.css`
  - `validation.js` (client-side form validation)
- `.env` (NOT committed)
- `.env.example` (safe template)
- `README.md`

---

## Phased Plan (best build order)

### Phase 1 — Setup & Baseline

**Goal:** project boots and responds on port 3000.

Checklist:

- [x] `npm init -y`
- [x] Install core deps: `express`, `dotenv`
- [x] Create `app.js` and `server.js`
- [x] Add a simple `/` route that returns “OK”
- [x] Add `PORT=3000` to `.env.example`

Definition of Done:

- Running `node server.js` starts the server
- Visiting `http://localhost:3000` works

---

### Phase 2 — Database + Models

**Goal:** MongoDB connection works and models exist.

Checklist:

- [x] Install: `mongoose`
- [x] Connect to MongoDB in `server.js` using `process.env.MONGODB_URI`
- [x] Create `models/User.js` (start minimal)
  - fields: `username`, `usernameLower`, `email`, `emailLower`, `passwordHash`, `createdAt`
- [x] Create `models/Note.js`
  - fields: `userId`, `title`, `content`, `createdAt`, `updatedAt`

Definition of Done:

- App connects to MongoDB on startup
- I can create a Note/User in a quick script or route

---

### Phase 3 — Local Auth (Passport Local)

**Goal:** users can register/login/logout.

Checklist:

- [x] Install: `express-session`, `passport`, `passport-local`, `bcrypt`
- [x] Configure sessions
- [x] Session cookie settings (simple defaults): `httpOnly: true`, and `secure: true` only in production
- [x] Create Passport Local strategy
- [x] Hash passwords with `bcrypt` on registration and store only `passwordHash` (never store plain passwords)
- [x] On login, compare the provided password with `bcrypt.compare(...)`
- [x] Login accepts a single field: `usernameOrEmail` + `password`
- [x] Username login is case-insensitive (use `usernameLower` to find the user)
- [x] Email login is case-insensitive (use `emailLower` to find the user)
- [x] Registration validation: password is 6+ chars and contains at least one letter OR one number
- [x] Registration validation (email): trim, max length 100, store lowercase in `emailLower`, and validate with a basic email format regex (server-side)
- [x] Registration validation (username): trim, length rules (ex: 3–30), and allow only simple characters (letters/numbers/underscore)
- [x] Uniqueness: prevent duplicate accounts (unique username + unique email) and show a friendly “already exists” message
- [x] Create auth routes:
  - `GET /register`, `POST /register`
  - `GET /login`, `POST /login`
  - `POST /logout`
- [x] Add `middleware/ensureAuth.js`
  - `ensureAuthPage` (redirect to `/login` when logged out)
  - `ensureAuthApi` (return `401` JSON when logged out)

Note:

- It’s listed in the folder layout for completeness, but I will actually create `middleware/ensureAuth.js` during **Phase 3**.

Definition of Done:

- [x] I can create an account and login
- [x] I can protect a test page route using `ensureAuthPage`

---

### Phase 4 — Notes API (CRUD)

**Goal:** REST API exists and is protected per user.

Routes (example):

- `GET /api/notes` → list current user’s notes
- `GET /api/notes/:id` → get one note (owned by user)
- `POST /api/notes` → create note
- `PUT /api/notes/:id` → update note
- `DELETE /api/notes/:id` → delete note

Checklist:

- [x] Build `routes/noteApiRoutes.js`
- [x] Build `controllers/noteController.js`
- [x] Protect all note API routes with `ensureAuthApi`
- [x] Add ownership checks: user can only access their own notes
- [x] Use scoped queries in controllers (example: `{ _id: id, userId: req.user._id }`)
- [x] Add consistent JSON error responses using one shape: `res.status(code).json({ error: { message } })`

Note:

- `GET` requests usually have **no body** (just read the JSON response).
- `POST` and `PUT` will send JSON with `Content-Type: application/json`.
- `DELETE /api/notes/:id` usually has **no body** (the id is in the URL).
- These endpoints are mainly for requirement/testing (ex: Postman). The UI pages will use normal form submits.

Definition of Done:

- CRUD works in Postman
- A user cannot access another user’s notes

---

### Phase 5 — Validation + Error Handling

**Goal:** bad input gives clear messages.

Validation examples:

- [x] title required (min length 1)
- [x] content optional or required (my choice: optional, but max length enforced)

Checklist:

- [x] Validate note input on create/update (for both form submits and API JSON)
- [x] Sanitize/normalize inputs on the server (trim strings, enforce max lengths like email ≤ 100, and normalize email/username to lowercase fields)
- [x] Return friendly errors (status + message)
  - [x] `400` invalid input
  - [x] `401` not logged in
  - [x] `403` not owner
  - [x] `404` note not found
  - [x] `500` server error

Note:

- [ ] UI pages: show errors by re-rendering the EJS page with a simple message. (Phase 7)
- [x] API: show errors with `res.status(...).json({ error: { message } })`.
- [x] EJS escapes output by default with `<%= %>`, which helps prevent unsafe HTML injection, but I should still trim/limit input and avoid rendering raw HTML.

Definition of Done:

- [x] Invalid requests never crash the server
- [ ] The front end can display messages from the server (Phase 7)

---

### Phase 6 — Auth0 Login (Day 4–5)

**Goal:** at least one third-party login works using Auth0.

Plan:

- Implement **Auth0** login

Checklist:

- [ ] Install Auth0 Passport strategy (example: `passport-auth0`)
- [x] Add `.env.example` variables (Auth0 domain, client id/secret, callback URL)
- [ ] Add routes:
  - `GET /auth/auth0`
  - `GET /auth/auth0/callback`
- [ ] Link Auth0 user to User model

Definition of Done:

- I can log in using Auth0 and see my notes area

---

### Phase 7 — Front End (EJS + Bootstrap) (Day 5–6)

**Goal:** usable UI for notes CRUD using EJS + form submits.

Pages:

- Home page
- Login/Register
- Notes list page (`/notes`)
- Notes edit page (`/notes/:id/edit`)

Checklist:

- [ ] Add EJS views + partials (header/nav/footer)
- [ ] Add Bootstrap via CDN
- [ ] Add `public/validation.js` and include it on pages with forms (login/register/notes)
- [ ] Show success/error messages on pages using a simple convention (ex: pass `error` / `success` into `res.render`)
- [ ] Add `GET /notes` route that renders the notes list + create form (EJS)
- [ ] Protect `GET /notes` with `ensureAuthPage` (redirect to login if not logged in)
- [ ] Add `GET /notes/:id/edit` route (renders edit form)
- [ ] Add simple form submit routes:
  - `POST /notes` (create)
  - `POST /notes/:id` (update)
  - `POST /notes/:id/delete` (delete)
- [ ] Keep UI simple and clean

Definition of Done:

- I can manage notes without Postman

Note:

- Even though the UI uses forms, the REST API endpoints still exist at `/api/notes` to satisfy the instructions.
- For the UI routes, we use `POST` for update/delete so we don’t need extra tools like method-override.
- `public/validation.js` is only for user experience (client-side). Server-side validation still must exist and is the real authority.
- Keep `public/validation.js` minimal (catch obvious empty/too-long fields). Don’t try to replicate every server rule.

---

### Phase 8 — Final Polish + Documentation (Day 6–7)

**Goal:** project is easy to run and easy to grade.

Checklist:

- [ ] `README.md` includes:
  - install steps
  - `.env` variables needed
  - how to run (`npm start`)
  - API endpoints with example request/response
- [ ] Add “What I learned / difficulties” notes
- [ ] Confirm nothing sensitive is committed
- [ ] Confirm all major features work end-to-end

Definition of Done:

- A classmate can clone, configure `.env`, and run locally

---

## Environment Variables (.env)

Example keys to plan for:

- `PORT=3000`
- `MONGODB_URI=...`
- `SESSION_SECRET=...`

Auth0:

- `AUTH0_DOMAIN=...`
- `AUTH0_CLIENT_ID=...`
- `AUTH0_CLIENT_SECRET=...`
- `AUTH0_CALLBACK_URL=http://localhost:3000/auth/auth0/callback`

---
