# Notifications

Single source of truth for the notification system: types, schema, service API, testing, and the scheduler worker next step.

## Scope

Two tables:

- `notifications`: per-user inbox rows (read/unread)
- `scheduled_notifications`: future work items to fan out into `notifications`

Rule: do not write to `notifications` directly; all inbox writes go through `NotificationService`.

## Notification types

| Type | ID | Trigger | Recipients | `refId` meaning |
|---|---:|---|---|---|
| `MEAL_PROPOSAL` | 1 | A member proposes a meal | All family members except the author | `proposal_id` |
| `MEAL_FINALIZED` | 2 | Voting ends / meal finalized | All family members | `meal_id` |
| `MEMBER_JOINED` | 3 | New member joins | Existing family members (optionally exclude the new member) | `member_id` or `family_id` |
| `REMINDER` | 4 | Scheduled reminder fires | All family members | `meal_id` |
| `COOK_ASSIGNED` | 5 | Cook assigned to meal | Assigned user only | `meal_id` |

## Where notifications are triggered (current integration)

- `MEAL_PROPOSAL`: `src/modules/proposals/proposal.service.ts` after proposal creation (fanout to family members except author)
- `MEMBER_JOINED`: `src/modules/families/family.service.ts` after adding a member (fanout to existing members excluding the new member)
- `MEAL_FINALIZED` + `COOK_ASSIGNED`: `src/modules/meals/meal.admin.service.ts` after finalizing a meal (fanout to all members + notify the cook)
- `REMINDER`: `workers/notification-scheduler/scheduler.ts` (worker fans out due scheduled rows)

## Database schema

Migration: `drizzle/0010_add_notifications_tables.sql`

### `notifications`

- Columns: `user_id`, `family_id` (nullable), `type`, `ref_id` (nullable), `is_read`, `read_at`, `created_at`
- Dedup constraint: unique `(user_id, family_id, type, ref_id)` (retry-safe fanout)
- Indexes (query patterns):
  - List/pagination: `(user_id, family_id, created_at DESC)`
  - Unread fast-path: `(user_id, family_id) WHERE is_read = false`

### `scheduled_notifications`

- Columns: `type`, `family_id`, `ref_id`, `scheduled_at`, `status`, `created_at`
- Index: `(status, scheduled_at)` for scanning the pending queue
- `status`: `PENDING` → `DONE` (or `CANCELED`)

## Types

Defined in `src/shared/notifications.ts`.

- `NotificationTypeId` + `NotificationType` (1–5)
- `ScheduleStatus` (`PENDING` / `DONE` / `CANCELED`)

## NotificationService (current code)

Implementation: `src/modules/notifications/notification.service.ts`

### Core inbox API

- `createForUser(input)` (single user, idempotent)
- `createForUsers(input)` (batch fanout, requires `familyId` + `refId`, idempotent, returns `{ created }`)
- `list({ userId, familyId, limit, cursor? })` (cursor pagination, newest first)
- `unreadCount({ userId, familyId })`
- `markAsRead({ notificationId, userId, familyId })` (ownership + family checks, idempotent; doesn’t rewrite `readAt` once read)
- `markAllAsRead({ userId, familyId })` (bulk update unread only, returns updated count)

### Scheduler primitives (already implemented)

- `schedule({ familyId, type, refId, scheduledAt })`
- `listDue({ now?, limit })`
- `markScheduledDone(id)`

## Guarantees (why this design is robust)

- Idempotent inbox writes via unique key + `onConflictDoNothing`
- Retry-safe scheduler: `PENDING` schedules can be re-processed; dedupe prevents duplicates
- One write path: `NotificationService` is the single abstraction for `notifications` writes

## Testing

Prereqs:

- `npm run db:migrate`
- `.env` has `DATABASE_URL`

Run:

- `npx vitest src/modules/notifications/__tests__/notification.service.unit.ts --run`

Cleanup:

- `npm run test:cleanup` (deletes only the fixed test fixture rows)

---

## Next step: Build the Scheduler Worker

### Step 1 — Create a dedicated worker entry point

Do NOT put this in your API server.

Example:

```text
/workers/notification-scheduler
  ├─ index.ts
  ├─ scheduler.ts
```

Run worker (separate process):

- `npm run worker:notification-scheduler`

Vercel production note:

- Vercel doesn’t run long-lived workers reliably; use Vercel Cron Jobs instead.
- Cron endpoints (public, but limited to Vercel cron header or `CRON_SECRET`):
  - `GET /api/cron/notifications/tick`
  - `GET /api/cron/notifications/cleanup`
- `vercel.json` configures schedules (every minute + daily 03:00 UTC).

`index.ts`

- connects to DB
- instantiates `NotificationService`
- starts cron

### Step 2 — Add node-cron

Install:

```bash
npm install node-cron
```

In `scheduler.ts`:

- schedule job every minute
- UTC only
- log start / end

### Step 3 — Implement the core scheduler loop

This loop will only use methods you already wrote.

Pseudo-flow (exact)

```text
every minute:
  due = notificationService.listDue({ limit: 100 })

  for each schedule in due:
    familyMembers = getFamilyMemberIds(schedule.familyId)

    notificationService.createForUsers({
      users: familyMembers,
      familyId: schedule.familyId,
      type: schedule.type,
      refId: schedule.refId
    })

    notificationService.markScheduledDone(schedule.id)
```

Key points

- Do NOT re-implement logic
- Do NOT write to notifications table directly
- All writes go through `NotificationService`

### Step 4 — Wrap each schedule in a transaction (important)

For each scheduled row:

- create notifications
- mark schedule DONE

These two must be atomic.

If process crashes:

- schedule remains PENDING
- next run retries
- dedupe prevents duplicates

👉 This is why your design is robust.

### Step 5 — Add minimal logging

Log:

- schedule id
- familyId
- type
- number of notifications created

Nothing fancy.

### Step 6 — Manual test (very important)

Insert a scheduled notification with `scheduled_at = now() - 1 min`

Start worker

Verify:

- notifications created
- schedule marked DONE

Restart worker

Verify:

- no duplicates

If this works → system is correct.

---

## Cleanup job (retention)

Retention rules (fixed):

- Read notifications: delete after **20 days**
- Any notifications: delete after **60 days**
- `DONE` scheduled_notifications: delete after **14 days**
- `CANCELED` scheduled_notifications: delete after **1 day**

Implementation:

- Worker runs a daily DB-only cleanup at **03:00 UTC** (no `NotificationService`): `workers/notification-scheduler/scheduler.ts`
- Mini unit test: `src/modules/notifications/__tests__/notification.cleanup.unit.ts`

---

## Notification API

### 1) List notifications (main inbox)

- `GET /api/families/:familyId/notifications?limit=20&cursor=2026-01-23T09:12:00.000Z`

Response:

```json
{
  "items": [
    {
      "id": "uuid",
      "type": 4,
      "refId": "meal-uuid",
      "isRead": false,
      "createdAt": "2026-01-23T09:10:00.000Z",
      "readAt": null
    }
  ],
  "nextCursor": "2026-01-23T09:10:00.000Z"
}
```

### 2) Unread count (badge)

- `GET /api/families/:familyId/notifications/unread-count`

Response:

```json
{ "count": 3 }
```

### 3) Mark ONE notification as read (idempotent)

- `POST /api/families/:familyId/notifications/:id/read`

Response: `204 No Content`

### 4) Mark ALL as read (family scope)

- `POST /api/families/:familyId/notifications/read-all`

Response:

```json
{ "updated": 5 }
```
