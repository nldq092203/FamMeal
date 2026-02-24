# FamMeal — Backend API

REST API for FamMeal, a family meal planning platform.

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: JavaScript (CommonJS)
- **Framework**: Express.js
- **ORM**: Sequelize v6 (PostgreSQL)
- **Validation**: Joi
- **Auth**: JWT (access + refresh tokens)
- **Cache**: Redis (optional, via ioredis)
- **Logging**: Winston

## Project Structure

```
src/
├── index.js                     # Entry point — server bootstrap + graceful shutdown
├── app.js                       # Express app factory (buildApp)
│
├── config/
│   ├── env.js                   # Joi-validated environment variables
│   └── database.js              # Sequelize connection + pool
│
├── db/
│   └── models/                  # Sequelize model definitions + associations
│       ├── index.js             # Model registry + relationships
│       ├── User.js
│       ├── Family.js
│       ├── FamilyMember.js
│       ├── Meal.js
│       ├── Proposal.js
│       ├── Vote.js
│       ├── Notification.js
│       └── ...
│
├── modules/                     # Feature modules (controller → service → db)
│   ├── auth/                    # Register, login, refresh, /me
│   ├── users/                   # CRUD + profile
│   ├── families/                # Family CRUD + admin routes
│   ├── meals/                   # Meal lifecycle + admin ops + history
│   ├── proposals/               # Proposal CRUD within meals
│   ├── votes/                   # Ranked voting within proposals
│   └── notifications/           # Family notification feed + cron jobs
│
├── middleware/
│   ├── auth.middleware.js       # JWT verification
│   ├── rbac.middleware.js       # requireFamilyAdmin
│   ├── validate.middleware.js   # Joi request validation
│   ├── rateLimiter.middleware.js
│   └── errorHandler.middleware.js
│
├── shared/
│   ├── errors.js                # Custom error classes
│   ├── logger.js                # Winston logger
│   ├── asyncHandler.js          # Async Express wrapper
│   ├── notifications.js         # Notification type constants
│   └── cache/                   # Redis cache utilities
│
├── scripts/
│   └── sync.js                  # Sequelize sync (schema migrations)
│
└── __tests__/                   # Integration tests (Jest + supertest)
```

## Architecture

Each feature module follows a consistent layered pattern:

| Layer | File | Responsibility |
|---|---|---|
| **Routes** | `*.routes.js` | HTTP method + path + middleware chain |
| **Controller** | `*.controller.js` | Parse request → call service → send response |
| **Service** | `*.service.js` | Business logic + Sequelize queries |
| **Validation** | `*.validation.js` | Joi schemas for request validation |

## Running Standalone

```bash
# Install dependencies
npm install

# Copy env template and edit secrets
cp .env.example .env

# Sync database schema
npm run db:sync

# Start server
npm start          # or: npm run dev
```

## Environment Variables

See `.env.example` for the full list. Required:

| Variable | Notes |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Min 32 characters |
| `JWT_REFRESH_SECRET` | Min 32 characters |

## Tests

```bash
npm test                 # run all integration tests
npm run test:coverage    # with coverage report
```

Tests use a real PostgreSQL database (configured via `DATABASE_URL`).
