# FamMeal

## 1. Project Overview

FamMeal is a family meal planning platform that turns meal decisions into a shared workflow instead of a single-person burden. It combines proposal submission, ranked voting, and admin finalization so families can decide meals transparently and consistently.

**Stack:** React + TypeScript frontend, Node.js + Express backend, PostgreSQL, Redis, Docker Compose.

**UI note:** FamMeal is **mobile-first**. For the best experience on desktop, open your browser's responsive design mode and switch to a mobile viewport.

---

## 2. Quick Start — Run the Full Stack in One Command

> **Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

```bash
git clone <repo-url> && cd FamMeal
make dev
```

That's it. Docker Compose builds all images, starts PostgreSQL + Redis + backend + frontend with **hot reload**, and runs database schema sync automatically.

| Service  | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Health check | http://localhost:3000/health |

> No `.env` file needed for Docker — sensible defaults (including development JWT secrets) are baked into `docker-compose.yml`.
> Only create a root `.env` if you want to override secrets or ports.

### Stop & clean up

```bash
make down            # stop containers (data preserved)
make down-volumes    # stop + wipe database and Redis
make clean           # remove containers, images, and volumes
```

### Other useful commands

| Command | What it does |
|---|---|
| `make prod` | Production-like mode (Nginx frontend at `:8080`, no hot reload) |
| `make logs` | Tail backend + frontend logs |
| `make logs-all` | Tail all services including Postgres and Redis |
| `make ps` | Show running containers and status |
| `make restart` | Restart all services |
| `make shell-backend` | Open a shell inside the backend container |
| `make shell-postgres` | Open a `psql` session |
| `make migrate` | Run database schema sync manually |

Run `make help` for the complete list.

---

## 3. Live Demo

Don't want to set up anything locally? The app is already live:

👉 **[https://fam-meal-6dno.vercel.app](https://fam-meal-6dno.vercel.app/)**

Create an account, start a family, and explore the full meal planning workflow. Use a mobile viewport for the intended layout.

---

## 4. Why This Project Exists (Business Purpose)

Many households rely on one person to decide and coordinate meals. That creates hidden operational load: repeated decision fatigue, low participation, and conflict around preferences.

FamMeal addresses this by:
- Distributing decision-making across family members.
- Capturing preferences and constraints (diet, budget, prep time) in structured form.
- Converting subjective discussion into a repeatable decision flow: **propose → rank → finalize → notify**.

---

## 5. Business Logic (Domain Rules and Decision Flow)

### Domain model

- `User`: authenticated person in the system.
- `Family`: collaboration boundary and settings container.
- `FamilyMember`: user-family link with role (`ADMIN` or `MEMBER`).
- `Meal`: planning unit (`PLANNING`, `LOCKED`, `COMPLETED`, `CANCELLED`).
- `Proposal`: candidate dish for a meal.
- `Vote`: ranked vote for a proposal.
- `Notification`: per-user event stream for family activity.

```mermaid
classDiagram
    class User {
      +uuid id
      +string email
      +string username
      +string name
    }

    class Family {
      +uuid id
      +string name
      +json settings
    }

    class FamilyMember {
      +uuid familyId
      +uuid userId
      +enum role
      +datetime joinedAt
    }

    class Meal {
      +uuid id
      +uuid familyId
      +uuid cookUserId
      +date scheduledFor
      +enum status
      +json constraints
      +json finalDecision
    }

    class Proposal {
      +uuid id
      +uuid mealId
      +uuid userId
      +string dishName
      +text notes
    }

    class Vote {
      +uuid id
      +uuid proposalId
      +uuid userId
      +int rankPosition
    }

    class Notification {
      +uuid id
      +uuid userId
      +uuid familyId
      +int type
      +uuid refId
      +bool isRead
      +datetime createdAt
    }

    User "1" --> "*" FamilyMember : belongs_to
    Family "1" --> "*" FamilyMember : has_members
    Family "1" --> "*" Meal : owns
    Meal "1" --> "*" Proposal : receives
    Proposal "1" --> "*" Vote : ranked_by
    User "1" --> "*" Proposal : creates
    User "1" --> "*" Vote : casts
    User "1" --> "*" Notification : receives
    Family "1" --> "*" Notification : scopes
```

### Core rules

- Family data is membership-scoped: users must belong to a family to access its meals/proposals/votes/notifications.
- Meal creation/update/deletion is admin-only.
- Proposals and votes are allowed only while meal status is `PLANNING`.
- Voting uses ranked positions and Borda-style scoring (`rank 1 = highest points`).
- Admin finalization is allowed only when meal status is `LOCKED`.
- Finalization records decision metadata and assigned cook, then emits notifications.
- Family management (edit family, invite/remove members, delete family) is admin-only.

### Meal state machine

```mermaid
stateDiagram-v2
    [*] --> PLANNING: Admin creates meal
    PLANNING --> LOCKED: Admin closes voting
    LOCKED --> PLANNING: Admin reopens voting
    LOCKED --> COMPLETED: Admin finalizes meal
    PLANNING --> CANCELLED: Admin cancels meal

    state PLANNING {
      [*] --> Open
      Open: Members can propose
      Open: Members can vote
    }

    state LOCKED {
      [*] --> Closed
      Closed: Proposal/vote updates blocked
      Closed: Await admin decision
    }

    state COMPLETED {
      [*] --> Finalized
      Finalized: Save finalDecision + cookUserId
      Finalized: Emit MEAL_FINALIZED/COOK_ASSIGNED notifications
    }
```

### Decision flow

```mermaid
sequenceDiagram
    participant A as Admin
    participant M as Members
    participant API as Backend API
    participant DB as PostgreSQL
    participant N as Notification Service

    A->>API: Create meal (status=PLANNING)
    API->>DB: Insert meal + constraints

    M->>API: Submit proposals
    API->>DB: Insert proposals
    API->>N: Notify family (new proposal)

    M->>API: Submit ranked votes
    API->>DB: Upsert votes (rank uniqueness checks)

    A->>API: Close voting
    API->>DB: Meal status -> LOCKED

    A->>API: Finalize meal (selected proposal(s), cook)
    API->>DB: Meal status -> COMPLETED + finalDecision
    API->>N: Notify family (meal finalized + cook assigned)
```

---

## 6. RBAC (Roles and Permissions)

### How access is decided

FamMeal's access control is three layers:

1. **Authentication**: request must carry a valid JWT.
2. **Family scope**: user must be a member of the family that owns the resource.
3. **Admin scope**: some actions additionally require `ADMIN` role within that family.

The backend is the source of truth. The frontend also gates UI actions (e.g. `AdminOnly` / `PermissionGate`), but API enforcement is what matters.

### Roles

- `ADMIN`: manages family settings/members and controls meal lifecycle (create/update/delete meals, close/reopen/finalize voting).
- `MEMBER`: participates in proposing and voting within families they belong to.

### Enforcement map

- **JWT required**: Express `authMiddleware` (global hook for protected routes).
- **Family membership**: checked using family membership lookup (directly via `familyId` params, or by resolving meal/proposal to its family).
- **Family admin**: routes under `/api/admin/*` use `requireFamilyAdmin` middleware; meal admin operations enforce `ADMIN` in the service layer.

### Permissions matrix

| Capability | Scope | ADMIN | MEMBER | Backend enforcement |
|---|---|:---:|:---:|---|
| View family details, meals, proposals, votes | Family | ✅ | ✅ | Membership check |
| Update family settings (dietary/cuisine/budget) | Family | ✅ | ❌ | `requireFamilyAdmin` |
| Edit family info (name/avatar) | Family | ✅ | ❌ | `requireFamilyAdmin` |
| Invite/remove members | Family | ✅ | ❌ | `requireFamilyAdmin` |
| Delete family | Family | ✅ | ❌ | `requireFamilyAdmin` |
| Create/update/delete meal | Family | ✅ | ❌ | Service checks admin role |
| Create proposal | Meal | ✅ | ✅ | Membership + `PLANNING` status |
| Update/delete own proposal | Meal | ✅ | ✅ | Ownership + `PLANNING` status |
| Submit ranked votes | Meal | ✅ | ✅ | Membership + `PLANNING` + rank uniqueness |
| Close/reopen voting | Meal | ✅ | ❌ | Admin role required |
| Finalize meal | Meal | ✅ | ❌ | Admin role + `LOCKED` status |
| View/manage notifications | Family | ✅ | ✅ | Membership + ownership |

---

## 7. Architecture

### Backend

```mermaid
flowchart LR
    Client[Frontend SPA] --> API[Express App]
    API --> Auth[Auth Middleware + JWT]
    API --> Users[Users Module]
    API --> Families[Families Module]
    API --> Meals[Meals + Admin Modules]
    API --> Proposals[Proposals Module]
    API --> Votes[Votes Module]
    API --> Notifs[Notifications Module]

    Users --> DB[(PostgreSQL)]
    Families --> DB
    Meals --> DB
    Proposals --> DB
    Votes --> DB
    Notifs --> DB

    API --> Cache[(Redis Cache)]
```

Backend is module-based (`controller → service → db`) with Joi validation and centralized error handling. PostgreSQL is the source of truth; Redis is used as optional shared cache.

### Frontend

```mermaid
flowchart LR
    UI[React Pages] --> Router[React Router]
    Router --> Guards[ProtectedRoute / PublicOnlyRoute / FamilyGate]
    Guards --> Ctx[AuthContext + FamilyContext + ToastContext]
    UI --> Query[React Query Hooks]
    Query --> API[Axios API Client]
    API --> Backend[Express API]

    UI --> RBAC[PermissionGate / AdminOnly]
    RBAC --> Ctx
```

Frontend is a route-driven SPA with guard layers for authentication and active family context. Data flows through React Query hooks and typed API services; role-aware UI behavior is enforced with permission gates.

### Docker

```mermaid
flowchart TB
    User[Developer] --> FE[frontend container\nVite dev or Nginx]
    FE --> BE[backend container\nNode.js + Express]
    BE --> PG[(postgres container)]
    BE --> RD[(redis container)]

    subgraph ComposeNetwork[Compose Network]
      FE
      BE
      PG
      RD
    end

    HostPorts[Host Ports\n5173/8080 frontend\n3000 backend\n5432 postgres\n6379 redis]
    HostPorts --> FE
    HostPorts --> BE
    HostPorts --> PG
    HostPorts --> RD
```

`docker-compose.yml` defines production-like services; `docker-compose.override.yml` enables hot-reload development with Vite dev server and source bind-mounts.

---

## 8. Project Structure

```
FamMeal/
├── docker-compose.yml            # Production services
├── docker-compose.override.yml   # Dev overrides (hot reload, bind mounts)
├── Makefile                      # All Docker workflow commands
├── .dockerignore
├── .gitignore
│
├── backend/                      # Node.js + Express REST API
│   ├── Dockerfile
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js              # Server entry point
│       ├── app.js                # Express app factory
│       ├── config/               # Env validation + DB connection
│       ├── db/models/            # Sequelize models
│       ├── modules/              # Feature modules (auth, users, families, meals, proposals, votes, notifications)
│       ├── middleware/           # Auth, RBAC, validation, rate limiting, error handler
│       ├── shared/               # Logger, errors, cache, async handler
│       ├── scripts/              # DB sync script
│       └── __tests__/            # Integration tests (Jest + supertest)
│
└── frontend/                     # React + TypeScript SPA (Vite)
    ├── Dockerfile                # Multi-stage (dev + prod/nginx)
    ├── nginx.conf
    ├── package.json
    └── src/
        ├── App.tsx               # Routes + layout
        ├── api/                  # Axios client + service functions
        ├── query/                # React Query hooks + keys
        ├── context/              # Auth, Family, Toast contexts
        ├── stores/               # Zustand stores
        ├── pages/                # Route page components
        ├── components/           # Shared UI (Layout, Navigation, Guards, ui/)
        ├── types/                # TypeScript types
        └── utils/                # Permissions, session helpers
```

---

## 9. Environment Variables

Most variables have defaults baked into `docker-compose.yml` — you only need to set secrets if overriding.

### Backend

| Variable | Required | Default | Notes |
|---|:---:|---|---|
| `DATABASE_URL` | — | `postgresql://fammeal:changeme_pg_password@postgres:5432/fammeal` | Auto-set by Docker Compose |
| `JWT_ACCESS_SECRET` | ✅ | Dev default in compose | Random string, min 32 chars |
| `JWT_REFRESH_SECRET` | ✅ | Dev default in compose | Random string, min 32 chars |
| `PORT` | — | `3000` | |
| `NODE_ENV` | — | `production` (`development` in dev override) | |
| `CORS_ORIGIN` | — | `http://localhost:5173,http://localhost:8080,http://localhost:3000` | Comma-separated |
| `REDIS_URL` | — | `redis://redis:6379` | |
| `LOG_LEVEL` | — | `info` | `debug`, `info`, `warn`, `error` |
| `CRON_ENABLED` | — | `false` | Enable notification cron jobs |

### Frontend

| Variable | Required | Default | Notes |
|---|:---:|---|---|
| `VITE_API_BASE_URL` | — | `http://localhost:3000/api` | Backend API base URL |

### Infrastructure

| Variable | Required | Default | Notes |
|---|:---:|---|---|
| `POSTGRES_USER` | — | `fammeal` | |
| `POSTGRES_PASSWORD` | — | `changeme_pg_password` | Change in production! |
| `POSTGRES_DB` | — | `fammeal` | |

---

## 10. Using the App

Once `make dev` is running:

1. **Open** → [http://localhost:5173](http://localhost:5173)
2. **Register** — create an account with email, username, and password.
3. **Create a family** — set up a family workspace after logging in.
4. **Plan a meal** — as admin, create a meal with date and constraints.
5. **Propose & vote** — members suggest dishes and submit ranked votes.
6. **Finalize** — admin closes voting, picks a winner, assigns a cook → everyone gets notified.

> **Health check:** hit [http://localhost:3000/health](http://localhost:3000/health) for a `200 OK`.

---

## 11. Future Improvements

- Add OpenAPI/Swagger docs generation from route schemas.
- Expand audit trails for admin decisions.
- Add end-to-end test coverage for the full workflow.
