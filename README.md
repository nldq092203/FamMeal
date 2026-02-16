# FamMeal

## 1. Project Overview
FamMeal is a family meal planning platform that turns meal decisions into a shared workflow instead of a single-person burden. It combines proposal submission, ranked voting, and admin finalization so families can decide meals transparently and consistently.

**Current stack:** React frontend, Node.js backend, PostgreSQL, Redis, Docker Compose.

## 2. Why This Project Exists (Business Purpose)
Many households rely on one person to decide and coordinate meals. That creates hidden operational load: repeated decision fatigue, low participation, and conflict around preferences.

FamMeal addresses this by:
- Distributing decision-making across family members.
- Capturing preferences and constraints (diet, budget, prep time) in structured form.
- Converting subjective discussion into a repeatable decision flow: propose -> rank -> finalize -> notify.

## 3. Business Logic (Domain Rules and Decision Flow)
### Domain model (high level)
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

### Core rules implemented in backend
- Family data is membership-scoped: users must belong to a family to access its meals/proposals/votes/notifications.
- Meal creation/update/deletion is admin-only.
- Proposals and votes are allowed only while meal status is `PLANNING`.
- Voting uses ranked positions and Borda-style scoring (`rank 1 = highest points`).
- Admin finalization is allowed only when meal status is `LOCKED`.
- Finalization records decision metadata and assigned cook, then emits notifications.
- Family management (edit family, invite/remove members, delete family) is admin-only.

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
    participant API as Node.js API
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

## 4. Core Functionalities
- Authentication: register, login, token refresh, current-user lookup.
- Family workspace: create/select family, view family details, manage members and settings.
- Meal lifecycle: admin creates meals with constraints.
- Meal lifecycle: members add/edit/delete own proposals while planning is open.
- Meal lifecycle: members submit ranked votes.
- Meal lifecycle: admin closes/reopens voting and finalizes meal.
- History/notifications: family notification feed with unread count and read-state actions.
- User profile/account: edit profile and password.

## 5. RBAC (Roles and Permissions Matrix)
### RBAC framing (how access is actually decided)
Instead of treating RBAC as a single “role table”, FamMeal’s access control is easiest to reason about as **three layers**:
- **Authentication**: request must carry a valid JWT (most `/api/*` routes).
- **Family scope**: user must be a member of the family that owns the resource (meal/proposal/vote/notifications).
- **Admin scope**: some actions additionally require `ADMIN` within that family.

The backend is the source of truth. The frontend also gates UI actions (for example `AdminOnly` / permission helpers), but API enforcement is what matters.

### Roles
- `ADMIN`: manages family settings/members and controls meal lifecycle decisions (close/reopen/finalize; create/update/delete meals).
- `MEMBER`: participates in proposing and voting within families they belong to.

### Enforcement map (where checks happen)
- **JWT required** for protected routes: Fastify `authMiddleware` (global hook for protected route group).
- **Family membership required** for family-scoped reads/writes: checked using family membership (either directly via `familyId` params, or indirectly by resolving meal/proposal to its family).
- **Family admin required** for admin operations:
  - Family admin routes: `/api/admin/families/*` use `requireFamilyAdmin` (middleware).
  - Meal admin operations: `/api/admin/meals/*` are protected and enforced in service layer (`checkFamilyRole(..., 'ADMIN')`).

### Permissions matrix (capabilities, not just pages)
| Capability | What it means | Scope | ADMIN | MEMBER | Backend enforcement |
|---|---|---|---:|---:|---|
| `view_family` | View family details, meals, proposals, votes, notifications | Family | Yes | Yes | Membership checks on family-owned resources |
| `update_family_preferences` | Update family settings (dietary/cuisine/budget/prep defaults) | Family | Yes | No | `requireFamilyAdmin` / admin role checks |
| `edit_family_info` | Update family profile (name/avatar) | Family | Yes | No | `requireFamilyAdmin` / admin role checks |
| `invite_members` | Add a user to the family | Family | Yes | No | `requireFamilyAdmin` / admin role checks |
| `remove_members` | Remove other members from the family | Family | Yes | No | Admin-only for removing others; self-leave allowed by service rule |
| `delete_family` | Delete a family | Family | Yes | No | `requireFamilyAdmin` / admin role checks |
| `create_meal` | Create a meal plan for a family | Family | Yes | No | Service checks admin role (meal admin create) |
| `update_meal` | Update meal details/constraints | Family | Yes | No | Service checks admin role |
| `delete_meal` | Delete a meal | Family | Yes | No | Service checks admin role |
| `create_proposal` | Add a proposal to a meal | Meal (family-owned) | Yes | Yes | Membership + meal must be `PLANNING` |
| `update_own_proposal` | Edit your own proposal | Meal (family-owned) | Yes | Yes | Ownership + meal must be `PLANNING` |
| `delete_own_proposal` | Delete your own proposal | Meal (family-owned) | Yes | Yes | Ownership + meal must be `PLANNING` |
| `vote_on_meal` | Submit ranked votes | Meal (family-owned) | Yes | Yes | Membership + meal must be `PLANNING` + rank uniqueness rules |
| `override_voting` | Close/reopen voting | Meal (family-owned) | Yes | No | Admin role required |
| `finalize_meal` | Finalize meal decision + assign cook | Meal (family-owned) | Yes | No | Admin role required + meal must be `LOCKED` |
| `view_notifications` | Read notifications and unread count | Family | Yes | Yes | Membership + ownership checks on inbox actions |
| `manage_notifications` | Mark read / mark all read | Family | Yes | Yes | Ownership + family checks (idempotent) |

## 6. Architecture
### Backend Architecture (diagram + explanation)
```mermaid
flowchart LR
    Client[Frontend SPA / API Consumers] --> API[Node.js App]
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
    Scheduler[Notification Scheduler / Cron Endpoints] --> Notifs
    Scheduler --> DB
```

Backend is module-based (`controller -> service -> db`) with Zod validation and centralized error handling. PostgreSQL is the source of truth; Redis is used as optional shared cache and fast-path support.

### Frontend Architecture (diagram + explanation)
```mermaid
flowchart LR
    UI[React UI Pages] --> Router[React Router]
    Router --> Guards[ProtectedRoute / PublicOnlyRoute / FamilyGate]
    Guards --> Ctx[AuthContext + FamilyContext + ToastContext]
    UI --> Query[React Query Hooks]
    Query --> API[Axios API Client]
    API --> Backend[Node.js API]

    UI --> RBAC[PermissionGate / AdminOnly]
    RBAC --> Ctx
```

Frontend is a route-driven SPA with guard layers for authentication and active family context. Data flows through React Query hooks and typed API services; role-aware UI behavior is enforced with permission gates.

### Docker Architecture (diagram + explanation)
```mermaid
flowchart TB
    User[Developer] --> FE[frontend container\nVite dev or Nginx runner]
    FE --> BE[backend container\nNode.js + migrations on startup]
    BE --> PG[(postgres container)]
    BE --> RD[(redis container)]

    subgraph Compose Network
      FE
      BE
      PG
      RD
    end

    HostPorts[Host Ports\n5173/8080 frontend\n3000 backend\n5432 postgres\n6379 redis] --> Compose Network
```

`docker-compose.yml` defines production-like services; `docker-compose.override.yml` enables hot-reload development targets for frontend and backend.

## 7. Getting Started

### 🌐 Live Demo

Don't want to set up anything locally? The app is already live — jump right in:

👉 **[https://fam-meal-6dno.vercel.app](https://fam-meal-6dno.vercel.app/)**

Create an account, start a family, and explore the full meal planning workflow. Feel free to discover!

---

### Local Development with Docker

Prefer to run things locally? Everything runs through **Make** — no need to memorize long Docker commands. Just make sure Docker Desktop is running and you're good to go.

### 7.1 First-time setup

Create a `.env` file in the project root with at least these two secrets (pick any random strings, 32+ characters each):

```env
JWT_ACCESS_SECRET=your-access-secret-at-least-32-chars-long
JWT_REFRESH_SECRET=your-refresh-secret-at-least-32-chars-long
```

> Everything else (database URL, Redis, ports) has sensible defaults baked into `docker-compose.yml` — you only need to override them if you want to.

### 7.2 Start the dev environment

```bash
make dev
```

That's it! This builds all images, runs database migrations automatically, and starts every service with **hot reload** enabled. You'll see a summary like:

```
Dev environment started
   Backend:  http://localhost:3000
   Frontend: http://localhost:5173
   Health:   http://localhost:3000/health
```

> **Production-like mode** (Nginx frontend, no hot reload): run `make prod` instead. The frontend will be available at `http://localhost:8080`.

### 7.3 Stop everything

```bash
make down            # stop and remove containers (data is preserved)
make down-volumes    # stop and also wipe database + Redis data
```

### 7.4 Other handy commands

Run `make help` to see the full list. Here are the most useful ones:

| Command | What it does |
|---|---|
| `make restart` | Restart all services |
| `make restart-backend` | Restart just the backend |
| `make ps` | Show running containers and their status |
| `make shell-backend` | Open a shell inside the backend container |
| `make shell-postgres` | Open a `psql` session against the database |
| `make migrate` | Run database migrations manually |
| `make clean` | Nuclear option — removes containers, images, and volumes |

### 7.5 Watching logs

Logs are your best friend when something isn't working. Pick whichever scope you need:

```bash
make logs            # tail backend + frontend (most common)
make logs-backend    # backend only
make logs-frontend   # frontend only
make logs-all        # everything including Postgres and Redis
```

All log commands stream in real time (`-f` flag), so you can leave them running in a separate terminal while you work.

> **Tip:** If the backend is crash-looping, check `make logs-backend` first — migration failures or missing env vars will show up there immediately.

### 7.6 Using the app

Once `make dev` is running and healthy:

1. **Open the app** → [http://localhost:5173](http://localhost:5173)
2. **Create an account** — register with an email, username, and password on the sign-up page.
3. **Create or join a family** — after logging in you'll be prompted to create a new family workspace or join an existing one.
4. **Start planning meals** — as an admin, create a meal with constraints (date, dietary prefs, budget). Family members can then propose dishes and submit ranked votes.
5. **Finalize** — the admin closes voting, reviews the results, picks a winner, assigns a cook, and everyone gets notified.

> **Quick health check:** hit [http://localhost:3000/health](http://localhost:3000/health) — you should get a `200 OK` with status info. If not, check the logs.

## 8. Environment Variables

Below is every variable the stack understands. **Most have defaults** so you only need to set the ones marked _required_.

### Backend

| Variable | Required | Default | Notes |
|---|:---:|---|---|
| `DATABASE_URL` | — | `postgresql://fammeal:changeme_pg_password@postgres:5432/fammeal` | Auto-set by Docker Compose; override only for external DBs |
| `JWT_ACCESS_SECRET` | ✅ | — | Random string, min 32 characters |
| `JWT_REFRESH_SECRET` | ✅ | — | Random string, min 32 characters |
| `PORT` | — | `3000` | |
| `HOST` | — | `0.0.0.0` | |
| `NODE_ENV` | — | `production` (override: `development` in dev) | |
| `CORS_ORIGIN` | — | `http://localhost:5173,http://localhost:8080,http://localhost:3000` | Comma-separated origins |
| `JWT_ACCESS_EXPIRES_IN` | — | `24h` | |
| `JWT_REFRESH_EXPIRES_IN` | — | `7d` | |
| `LOG_LEVEL` | — | `info` | `debug`, `info`, `warn`, `error` |
| `LOG_FILE` | — | — | Path to optional log file |
| `CRON_ENABLED` | — | `false` | Enable scheduled notification jobs |
| `CRON_SECRET` | — | — | Secret for cron endpoint auth |

### Frontend

| Variable | Required | Default | Notes |
|---|:---:|---|---|
| `VITE_API_BASE_URL` | — | `http://localhost:3000/api` | Points the SPA at the backend |

### Infrastructure (Postgres & Redis)

| Variable | Required | Default | Notes |
|---|:---:|---|---|
| `POSTGRES_USER` | — | `fammeal` | |
| `POSTGRES_PASSWORD` | — | `changeme_pg_password` | Change in production! |
| `POSTGRES_DB` | — | `fammeal` | |
| `REDIS_URL` | — | `redis://redis:6379` | |
| `CACHE_DEFAULT_TTL_SECONDS` | — | `60` | Redis cache TTL in seconds |

## 9. Future Improvements
- Add explicit API docs generation from route schemas/OpenAPI.
- Expand audit trails for admin decisions (who changed what, when).
- Add end-to-end test coverage for full workflow (`create meal -> vote -> finalize`).

## Assumptions
- This README reflects implemented modules and active routes in the current repository.
- The stack includes an optional scheduler worker/cron path for notifications; it is not currently modeled as a separate Docker Compose service.
- Some UI pages exist in codebase but are not part of the main route tree; functionality listed here focuses on actively wired flows.
