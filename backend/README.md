# 🍽️ Mama Meal - Family Meal Planning API

**Rebalancing meal decision-making responsibility in families**

A modern REST API built with Node.js, TypeScript, Fastify, and PostgreSQL to help families share the mental load of meal planning.

## 🎯 Context

In many families, **one person is responsible for deciding and preparing meals every day**. This creates mental load, frustration, and recurring conflicts. This API empowers families to **rebalance that responsibility** by involving all family members in the meal planning process.

## 🚀 Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript (strict mode)
- **Framework**: Fastify
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Validation**: Zod
- **Architecture**: Feature-based (module-based)

## 📁 Project Structure

```
src/
├── index.ts                 # App entry point
├── app.ts                   # Fastify instance & global plugins
│
├── config/
│   ├── env.ts               # Environment variable validation (Zod)
│   └── database.ts          # Database connection
│
├── db/
│   ├── index.ts
│   └── schema/              # Drizzle table definitions
│       └── user.table.ts    # Example table
│
├── modules/
│   └── users/
│       ├── user.schema.ts       # Zod schemas
│       ├── user.service.ts      # Business logic
│       ├── user.controller.ts   # HTTP handlers
│       └── user.routes.ts       # Fastify routes
│
├── plugins/
│   └── zod.ts               # Zod ↔ Fastify integration
│
└── shared/
    ├── errors.ts            # Custom errors
    └── types.ts             # Shared types
```

## 🏗️ Architectural Principles

### **Controllers**
- Handle HTTP only (request, reply)
- No database access
- Delegate to services

### **Services**
- Contain all business logic
- Use Drizzle ORM for DB operations
- No HTTP concerns

### **Schemas**
- Use Zod for validation
- Attached to routes via preHandler hooks
- Type-safe inference

## 📦 Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your PostgreSQL credentials
# DATABASE_URL=postgresql://user:password@localhost:5432/mama_meal
```

## ⚡️ Redis Cache (Optional)

Set `REDIS_URL` to enable shared caching (recommended for production).

- `REDIS_URL`: Redis connection URL (use `rediss://` for TLS providers)
- `CACHE_DEFAULT_TTL_SECONDS`: default TTL for cached items (seconds)

## 🪵 Logging (loguru-like)

Use `src/shared/logger.ts` for structured logs across the codebase:

- `LOG_LEVEL`: `trace|debug|info|warn|error|fatal|silent`
- `LOG_FILE`: optional file path for JSON logs (in addition to console output)

Example:
```ts
import { logger } from '@/shared/logger.js';

logger.debug({ userId: '...' }, 'Fetching suggestions');
```

## 🗄️ Database Setup

```bash
# Generate migration files from schema
npm run db:generate

# Run migrations
npm run db:migrate

# Open Drizzle Studio (visual database explorer)
npm run db:studio
```

## 📊 Database Schema (ERD)

```mermaid
erDiagram
    users ||--o{ family_members : "belongs to"
    users ||--o{ proposals : "creates"
    users ||--o{ votes : "casts"
    users ||--o{ meals : "cooks"
    families ||--o{ family_members : "has"
    families ||--o{ meals : "owns"
    meals ||--o{ proposals : "receives"
    proposals ||--o{ votes : "gets"

    users {
        uuid id PK
        varchar email UK "unique"
        varchar password "hashed"
        varchar username UK "unique"
        varchar name
        enum avatarId "default: panda"
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "soft delete"
    }

    families {
        uuid id PK
        varchar name
        enum avatarId "default: panda"
        jsonb settings "cuisine, dietary, budget"
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "soft delete"
    }

    family_members {
        uuid familyId FK,PK
        uuid userId FK,PK
        enum role "ADMIN or MEMBER"
        timestamp joinedAt
    }

    meals {
        uuid id PK
        uuid familyId FK
        uuid cookUserId FK "default: family ADMIN"
        date scheduledFor
        enum mealType "BREAKFAST, LUNCH, DINNER"
        enum status "PLANNING, LOCKED, COMPLETED, CANCELLED"
        jsonb constraints "budget, prep time, dietary"
        jsonb finalDecision "selected proposal, decided by"
        timestamp votingClosedAt
        timestamp finalizedAt
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "soft delete"
    }

    proposals {
        uuid id PK
        uuid mealId FK
        uuid userId FK
        varchar dishName
        text ingredients
        text notes
        jsonb extra "image URLs"
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "soft delete"
    }

    votes {
        uuid id PK
        uuid proposalId FK
        uuid userId FK
        integer rankPosition "1 = top choice"
        timestamp createdAt
        timestamp updatedAt
    }
```

### Key Relationships

- **Users ↔ Families**: Many-to-many through `family_members` junction table
- **Families → Meals**: One-to-many (each family has multiple meals)
- **Meals → Proposals**: One-to-many (each meal has multiple proposals)
- **Proposals → Votes**: One-to-many (each proposal can receive multiple votes)
- **Users → Proposals**: One-to-many (each user can create multiple proposals)
- **Users → Votes**: One-to-many (each user can cast multiple votes)

### Voting System

The voting system uses **ranked voting** (Borda count):
- Each user ranks proposals from 1 (best) to 10 (worst)
- Rank 1 = 10 points, Rank 2 = 9 points, ..., Rank 10 = 1 point
- Unique constraint ensures one user cannot assign the same rank to multiple proposals

## 🔧 Development

```bash
# Start development server with hot reload
npm run dev

# Type checking
npm run type-check

# Lint code
npm run lint
```

## 🏭 Production

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## 📡 API Endpoints

Detailed frontend-facing docs: `docs/API.md`

### Health Check
```
GET /health
```

### Auth Module

```
GET  /health

POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
GET  /api/auth/me           # Protected
```

### Users Module (Protected)

```
GET    /api/users          # List users (paginated)
GET    /api/users/:id      # Get user by ID
PATCH  /api/users/:id      # Update user
DELETE /api/users/:id      # Delete user
```


## 📝 Example Requests

### List Users
```bash
curl http://localhost:3000/api/users?page=1&pageSize=20 \
  -H "Authorization: Bearer <accessToken>"
```

## 🛡️ Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "message": "User with ID xyz not found",
    "code": "NOT_FOUND",
    "details": []
  },
  "meta": {
    "timestamp": "2026-01-20T10:00:00.000Z"
  }
}
```

## 🎨 Response Format

All successful responses follow:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-01-20T10:00:00.000Z"
  }
}
```

Paginated responses include:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 5,
    "totalItems": 100,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

## 🧩 Adding New Modules

To add a new feature module (e.g., `meals`):

1. **Create module directory**: `src/modules/meals/`
2. **Define schema**: `meals/meal.schema.ts` (Zod schemas)
3. **Create service**: `meals/meal.service.ts` (business logic + DB)
4. **Create controller**: `meals/meal.controller.ts` (HTTP handlers)
5. **Create routes**: `meals/meal.routes.ts` (Fastify routes)
6. **Register in app**: `app.ts` → `app.register(mealRoutes, { prefix: '/api/meals' })`

## 📊 Database Schema Example

```typescript
// src/db/schema/meal.table.ts
export const meals = pgTable('meals', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

## 🔐 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3000` |
| `HOST` | Server host | `0.0.0.0` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@localhost:5432/mama_meal` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | `http://localhost:3000` |

## 🤝 Contributing

This is a foundational scaffold. To extend it:

1. Add new modules in `src/modules/`
2. Define database schemas in `src/db/schema/`
3. Follow the Controller → Service → Database pattern
4. Use Zod for all validation
5. Keep TypeScript strict mode enabled

## 📄 License

MIT

---

**Built with ❤️ to help families share the mental load of meal planning**
