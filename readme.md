# ![Logo](./assets/WOG-logo1.png)

## Backend

Welcome to the backend side of World Of Games project.

## What it is

REST API for **World of Games**, a video game marketplace. Anyone can browse games; registered users can log in (JWT), manage their profile and create/edit/delete games.

Stack: Node.js, Express 4, TypeScript (ESM), MongoDB/Mongoose, Jest + Supertest, `mongodb-memory-server` for tests. The code follows a DDD layout (`games/` and `user/` each with `domain`, `application`, `infrastructure`; `server/` holds controllers, routers, interceptors and the Express wiring).

## Endpoints

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health` | public | Liveness check, returns `{ status, uptime }` |
| GET | `/games` | public | List all games |
| GET | `/games/:id` | public | Game details |
| GET | `/games/filter/:category` | public | Games by category (`Action`, `Adventure`, `RPG`, `FPS`, `MOBA`, `MMO`, `Sports`, `Strategy`, `Indie`) |
| POST | `/games` | Bearer token | Create a game |
| PUT | `/games/:id` | Bearer token | Update a game |
| DELETE | `/games/:id` | Bearer token | Delete a game |
| POST | `/users/register` | public | Register (name, email, password >= 8 chars) |
| POST | `/users/login` | public | Log in, returns a JWT |
| GET | `/users/:id` | Bearer token | User profile |
| PUT | `/users/:id` | Bearer token | Update profile |
| DELETE | `/users/:id` | Bearer token | Delete user |

Send tokens as `Authorization: Bearer <jwt>`.

Security: `helmet` headers, CORS limited to `CORS_ORIGINS`, `express-rate-limit` on login/register and on all write endpoints, 100kb JSON body limit.

## Run locally

```bash
npm install
cp .env.example .env     # set MONGODB_URI and SECRET
npm run build
npm start                # http://localhost:4800
```

Scripts: `build` (tsc), `build:watch`, `start`, `start:prod`, `start:mon` (nodemon), `test`, `test:watch`, `seed`.

### Tests

```bash
npm test
```

No `.env` and no database needed: tests spin up an in-memory MongoDB (`mongodb-memory-server`, configured in `jest.config.js` and `test/`). The first install downloads a `mongod` binary into `node_modules/.cache`; after that it works offline.

### Demo data

```bash
npm run seed
```

Idempotent (safe to re-run). Creates the user `demo@worldofgames.dev` / `DemoPass123!` (bcrypt-hashed) and 10 games whose covers match the frontend assets (`assets/covers/*-cover.jpeg`, override with `SEED_IMG_BASE`).

## Deploy notes

- Build command: `npm ci && npm run build`. Start command: `npm run start:prod`.
- Required env: `MONGODB_URI`, `SECRET`, `CORS_ORIGINS` (your frontend origin(s)). Optional: `NAME`, `PORT`, `TRUST_PROXY=1` (set it behind a proxy).
- Allow your host's outbound IPs in MongoDB Atlas network access.
- Point the platform health check at `GET /health`.
- Run `npm run seed` once against the production database if you want the demo user and catalogue.
- `npm run seed` also **resets the demo data**: it re-upserts the demo user (password included) and restores every demo game to its original fields (re-creating any that were deleted). Schedule it as a cron job on the demo deployment (e.g. nightly) to undo changes made by visitors. Games/users created by others are left untouched.
- Authorization: `GET/PUT/DELETE /users/:id` require the token's user id to match `:id`, and `PUT/DELETE /games/:id` require the token's user to be the game owner; otherwise the API answers `403`.
