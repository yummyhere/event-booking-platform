# Gather | Community Event Booking

Gather is a full-stack community events platform for discovering local gatherings, reserving tickets, and managing upcoming and past bookings.

## Features

- Browse and search events by title, description, location, category, date, and upcoming status.
- Register and log in with bcrypt-hashed passwords and expiring JWT sessions.
- Book one or more seats with server-calculated totals and an atomic SQLite seat update.
- Review active and past bookings, or cancel an upcoming booking to release its seats.
- Responsive event cards, booking dialog, form feedback, and protected account pages.
- Administrator event management, booking oversight, and platform summary statistics.

## Tech Stack

- Frontend: React 18, Vite, React Router, Context API, Axios, plain CSS.
- Backend: Node.js, Express, express-validator, JWT, bcryptjs.
- Database: SQLite3 with foreign keys, constraints, and indexes.

## Prerequisites

- Node.js 20 or newer (tested with Node.js 24).
- npm 10 or newer.

## Setup

Open two terminals at the repository root. Copy the environment templates before starting the services.

PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

macOS/Linux:

```sh
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Set `JWT_SECRET` in `backend/.env` to a long, unique random value before deployment. The example is for local setup only.

Install backend packages and seed the database:

```sh
cd backend
npm install
npm run seed
```

Start the backend in that terminal:

```sh
npm run dev
```

In the second terminal, install frontend packages and start Vite:

```sh
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. The API listens on <http://localhost:5000>. The server creates the database file and tables automatically on startup. It safely adds `users.role` to an existing database only when the column is absent; existing accounts receive the default `user` role. `npm run seed` inserts the demo user, one admin account, and 12 sample events without duplicating existing rows. If you change `DB_PATH`, use the same environment file when seeding and starting the server.

Production frontend build:

```sh
cd frontend
npm run build
```

## Environment Variables

Backend (`backend/.env`):

```dotenv
PORT=5000
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=1d
DB_PATH=./database/events.db
CLIENT_URL=http://localhost:5173
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change_this_before_seeding_production
```

Frontend (`frontend/.env`):

```dotenv
VITE_API_URL=http://localhost:5000/api
```

The backend loads `.env` from its current working directory. `DB_PATH` is relative to that directory. Configure `CLIENT_URL` to the exact browser origin serving the frontend.

## Deploy the Whole App on Vercel

The repository is configured as one Vercel project: the frontend builds to `frontend/dist`, and `api/[...path].js` exposes the existing Express API as a Vercel Node function. Vercel functions do not have persistent writable disk, so production must use Turso/libSQL; local runs continue to use the existing SQLite file when `TURSO_DATABASE_URL` is unset.

1. Create a Turso database and credentials using the Turso CLI:

  ```sh
  turso db create gather-events
  turso db show gather-events --url
  turso db tokens create gather-events
  ```

2. Import the Git repository into Vercel. Keep **Root Directory** at the repository root (not `frontend`). Vercel uses the root `package.json` workspace install, `npm run build`, and `frontend/dist` output from `vercel.json`.

3. Add these Vercel project environment variables for Production (and Preview if needed):

  ```dotenv
  JWT_SECRET=<long-random-secret>
  JWT_EXPIRES_IN=1d
  TURSO_DATABASE_URL=<libsql-database-url>
  TURSO_AUTH_TOKEN=<turso-auth-token>
  CLIENT_URL=https://your-project.vercel.app
  ```

  Leave `VITE_API_URL` unset in Vercel; the frontend automatically uses same-origin `/api`. If you set it explicitly, set it to `/api`, not localhost. Never commit Turso tokens or production secrets.

4. Before seeding production, set `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD` in a local, untracked `backend/.env` along with `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`. Then seed the remote database once:

  ```sh
  cd backend
  npm install
  npm run seed
  ```

  The first API invocation creates tables and safely applies the role migration. The seed command creates the admin with the configured credentials if absent; for an already-existing admin it preserves the current password. Do not use the demo admin password on a public deployment.

5. Deploy from Vercel and check `https://your-project.vercel.app/api/health`. The web app and API share the same origin; SQLite data remains in Turso and survives function cold starts and redeployments.

For local development, omit the `TURSO_*` variables to continue using `backend/database/events.db`. Keep Vercel's Root Directory at the repository root so both the `api` function and frontend build are included.

## Demo Account

- Email: `demo@gather.local`
- Password: `GatherDemo123!`

## Admin Panel

Seed the database with `cd backend; npm run seed` before using the admin account:

- Email: `admin@example.com`
- Password: `Admin@123`

The seed script hashes this password with bcrypt and does not create a duplicate user. If an account with that email already exists, the seed promotes it to `admin` and preserves its current password. Admin pages are protected by both the frontend route guard and backend JWT role middleware.

At startup, the migration checks `PRAGMA table_info(users)`. If the `role` column is missing, it runs `ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'))`; otherwise, it leaves the database unchanged. Existing users keep working with the default `user` role.

All admin routes require `Authorization: Bearer <admin-jwt>` and use the existing `{ "success": true, "data": ... }` response envelope.

`POST /api/events` (admin JWT required, returns `201`) creates an event. The server initializes `available_seats` to `total_seats`.

Request:

```json
{
  "title": "Community Garden Day",
  "description": "Plant and share a neighborhood garden.",
  "category": "Outdoors",
  "location": "Riverside Park",
  "event_date": "2027-05-10T10:00:00.000Z",
  "price": 0,
  "total_seats": 24,
  "image_url": "https://example.com/garden.jpg"
}
```

Response data is the created event object, including its generated ID and availability:

```json
{ "id": 13, "title": "Community Garden Day", "total_seats": 24, "available_seats": 24 }
```

`PUT /api/events/:id` (admin JWT required) updates event fields using the same request shape. Availability becomes `total_seats - confirmed booked seats`; totals below booked seats return `409`.

`DELETE /api/events/:id` (admin JWT required) deletes the event and its bookings via the foreign-key cascade. Success: `{ "success": true, "message": "Event and related bookings deleted successfully.", "data": { "id": 13 } }`. Missing events return `404`.

`GET /api/admin/bookings` (admin JWT required) returns all bookings joined with `user_name`, `user_email`, and `event_title`, newest first.

`GET /api/admin/stats` (admin JWT required) returns total events, bookings, users, and confirmed revenue in `data`, for example `{ "total_events": 12, "total_bookings": 4, "total_users": 8, "total_revenue": 92 }`.

`GET /api/auth/me` (valid JWT required) returns the current user, including `role`. Login and register responses also include `role`; public registration always creates a `user`, ignoring any submitted role.

Suggested feature commits:

1. `feat(db): add role column to users with migration`
2. `feat(auth): include role in JWT and responses`
3. `feat(admin-api): add adminOnly middleware and event CRUD endpoints`
4. `feat(admin-api): add admin bookings and stats endpoints`
5. `feat(admin-ui): add admin route guard navbar link and manage events page`
6. `feat(admin-ui): add event form modal and admin bookings page`
7. `docs: document admin panel in README`

## API

All successful responses use `{ "success": true, "data": ... }`. Errors use `{ "success": false, "message": "..." }`. Send protected requests with `Authorization: Bearer <token>`.

### Authentication

`POST /api/auth/register` (public, returns `201`)

Request:

```json
{ "name": "Alex Morgan", "email": "alex@example.com", "password": "password123" }
```

Response data:

```json
{ "user": { "id": 2, "name": "Alex Morgan", "email": "alex@example.com" }, "token": "<jwt>" }
```

`POST /api/auth/login` (public)

Request: `{ "email": "demo@gather.local", "password": "GatherDemo123!" }`. Returns the same user-and-token shape. Password hashes are never returned.

### Events

`GET /api/events` (public): returns an array of events. Optional query parameters are `search`, `category`, `date` (`YYYY-MM-DD`), and `upcoming=true`. Example: `/api/events?search=supper&category=Food%20%26%20drink&upcoming=true`.

`GET /api/events/:id` (public): returns one event or `404`.

Example event data:

```json
{ "id": 1, "title": "Sunday Table: A Neighborhood Supper", "category": "Food & drink", "location": "Juniper House, Brooklyn", "event_date": "2030-01-01T18:00:00.000Z", "price": 24, "total_seats": 28, "available_seats": 28, "image_url": "https://images.unsplash.com/..." }
```

### Bookings

`POST /api/bookings` (JWT required, returns `201`)

Request: `{ "event_id": 1, "tickets": 2 }`. The server validates date and availability, computes `total_price`, then changes seat inventory and creates the booking in one transaction. Insufficient inventory or a past event returns `409`.

`GET /api/user/bookings` (JWT required): returns the current user's bookings, newest first, joined with event title, date, location, price, and image. Each row includes `is_upcoming` (`1` or `0`).

`PATCH /api/bookings/:id/cancel` (JWT required): cancels the caller's upcoming confirmed booking and restores its seats. A caller cannot cancel another user's booking.

Example booking data:

```json
{ "id": 1, "user_id": 2, "event_id": 1, "tickets": 2, "total_price": 48, "status": "confirmed", "booked_at": "2030-01-01 12:00:00" }
```

## Project Structure

```text
event-booking-platform/
  api/
    [...path].js
  backend/
    src/
      config/       db.js, env.js
      controllers/  auth.js, bookings.js, events.js
      database/     schema.sql, seed.js
      middleware/   adminOnly.js, auth.js, errors.js
      routes/       admin.js, auth.js, bookings.js, events.js, user.js
      app.js
      server.js
    .env.example
    package.json
  package.json
  vercel.json
  frontend/
    src/
      api/           client.js
      components/    AdminStats, BookingModal, EventCard, EventForm, Loader, Navbar, ProtectedRoute, SearchFilters, Toast
      context/       AuthContext.jsx
      pages/         AdminBookings, AdminEvents, Events, Login, MyBookings, NotFound, Register
      styles/        global.css
      App.jsx
      main.jsx
    .env.example
    package.json
  .gitignore
  README.md
```

## Suggested Commit Sequence

1. `chore: initialize repository with gitignore and folder structure`
2. `feat(backend): setup express server and sqlite connection`
3. `feat(db): add users events and bookings schema with foreign keys`
4. `feat(auth): add register and login endpoints with JWT`
5. `feat(api): add events listing endpoint with search filters`
6. `feat(api): add booking creation and user bookings endpoints`
7. `chore(db): add seed script`
8. `feat(frontend): setup react app routing and theme`
9. `feat(auth-ui): add AuthContext login/register pages and protected routes`
10. `feat(events-ui): add events page with search filters and event cards`
11. `feat(booking-ui): add booking modal workflow`
12. `feat(dashboard): add My Bookings dashboard with active/past sections`
13. `docs: add README with setup instructions and env templates`