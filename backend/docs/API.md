# Mama Meal API (Frontend Reference)

## Base URL
- Local: `http://localhost:3000`
- All endpoints below are relative to the base URL.

## Content Type
- Request: `Content-Type: application/json`
- Response: JSON (except `204 No Content`)

## Auth
This API uses JWT Bearer tokens.

1) `POST /api/auth/login` returns `{ accessToken, refreshToken }`.
2) Send access token on protected routes:
   - `Authorization: Bearer <accessToken>`

### Public vs protected
- Public:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
- Protected (requires `Authorization`):
  - Everything else under `/api/*`
  - `GET /api/auth/me`

## Standard response shapes
### Success
Most success responses:
```json
{ "success": true, "data": {} }
```

Paginated responses:
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 1,
    "totalItems": 0,
    "hasNext": false,
    "hasPrevious": false
  }
}
```

### Error
Errors are normalized:
```json
{
  "success": false,
  "error": {
    "message": "...",
    "code": "UNAUTHORIZED",
    "details": []
  },
  "meta": { "timestamp": "2026-01-20T00:00:00.000Z" }
}
```

Common error codes:
- `VALIDATION_ERROR` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `CONFLICT` (409)

Notes:
- Some endpoints return `204 No Content` on success (empty body).

---

## Auth

### Register
`POST /api/auth/register`

Request body:
```json
{
  "email": "parent@example.com",
  "password": "password123",
  "username": "parent1",
  "name": "Parent One"
}
```

Notes:
- `username` must be unique.

Response `201`:
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### Login
`POST /api/auth/login`

Request body:
```json
{ "email": "parent@example.com", "password": "password123" }
```

Response `200`:
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### Refresh token
`POST /api/auth/refresh`

Request body:
```json
{ "refreshToken": "..." }
```

Response `200`:
```json
{ "success": true, "data": { "accessToken": "...", "refreshToken": "..." } }
```

### Current user
`GET /api/auth/me` (protected)

Response `200`:
```json
{ "success": true, "data": { "id": "uuid", "email": "parent@example.com", "username": "parent1", "name": "Parent One", "avatarId": "panda" } }
```

---

## Users (protected)

### List users
`GET /api/users?page=1&pageSize=20`

Response `200`:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "...",
      "username": "...",
      "name": "...",
      "avatarId": "panda",
      "createdAt": "2026-01-20T00:00:00.000Z",
      "updatedAt": "2026-01-20T00:00:00.000Z",
      "deletedAt": null
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "totalPages": 1, "totalItems": 1, "hasNext": false, "hasPrevious": false }
}
```

### Get user
`GET /api/users/:id`

Response `200`:
```json
{ "success": true, "data": { "id": "uuid", "email": "...", "username": "...", "name": "...", "avatarId": "panda" } }
```

### Suggest users (typeahead)
`GET /api/users/suggest?q=jo&limit=8`

Notes:
- Response is cached briefly (10–60s) when Redis is enabled.
- Endpoint is rate-limited.
- `avatarId` is the avatar identifier stored in the DB (e.g. `"panda"`).

Response `200`:
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "username": "john", "displayName": "John Doe", "avatarId": "panda" }
  ]
}
```

### Update user
`PATCH /api/users/:id`

Request body (any subset):
```json
{ "email": "new@example.com", "username": "newname", "name": "New Name", "avatarId": "raccoon", "password": "newpassword123" }
```

Response `200`:
```json
{ "success": true, "data": { "id": "uuid", "email": "new@example.com", "username": "newname", "name": "New Name", "avatarId": "raccoon" } }
```

### Delete user
`DELETE /api/users/:id`

Response `204 No Content`

---

## Families (protected)

### Create family
`POST /api/families`

Request body:
```json
{
  "name": "Nguyen Family",
  "avatarId": "panda",
  "settings": {
    "defaultCuisinePreferences": ["Vietnamese"],
    "defaultDietaryRestrictions": ["No peanuts"],
    "defaultMaxBudget": 25,
    "defaultMaxPrepTime": 45
  },
  "members": [
    { "username": "parent2", "role": "MEMBER" }
  ]
}
```

Response `201`:
```json
{ "success": true, "data": { "id": "uuid", "name": "Nguyen Family", "avatarId": "panda", "settings": {}, "createdAt": "...", "updatedAt": "...", "deletedAt": null } }
```

### Add family member (admin)
`POST /api/admin/families/:id/members`

Request body:
```json
{ "username": "parent2", "role": "MEMBER" }
```

Or:
```json
{ "email": "parent2@example.com", "role": "MEMBER" }
```

Response `201`:
```json
{ "success": true, "data": { "familyId": "uuid", "userId": "uuid", "role": "MEMBER", "joinedAt": "...", "avatarId": "panda" } }
```

### Update family profile (admin)
`PATCH /api/admin/families/:id/profile`

Request body (any subset):
```json
{ "name": "Nguyen Family", "avatarId": "panda" }
```

Response `200`:
```json
{ "success": true, "data": { "id": "uuid", "name": "Nguyen Family", "avatarId": "panda", "settings": {} } }
```

### Update family settings (admin)
`PATCH /api/admin/families/:id/settings`

Request body:
```json
{
  "settings": {
    "defaultCuisinePreferences": ["Vietnamese"],
    "defaultDietaryRestrictions": ["No peanuts"],
    "defaultMaxBudget": 25,
    "defaultMaxPrepTime": 45
  }
}
```

Response `200`:
```json
{ "success": true, "data": { "id": "uuid", "name": "Nguyen Family", "avatarId": "panda", "settings": {} } }
```

### List my families
`GET /api/families`

Response `200`:
```json
{ "success": true, "data": [ { "id": "uuid", "name": "...", "avatarId": "panda", "role": "ADMIN" } ] }
```

### Get family
`GET /api/families/:id`

Response `200`:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "...",
    "avatarId": "panda",
    "settings": {},
    "myRole": "ADMIN",
    "members": [
      { "userId": "uuid", "username": "parent1", "name": "Parent One", "avatarId": "panda", "role": "ADMIN", "joinedAt": "2026-01-20T00:00:00.000Z" }
    ]
  }
}
```

### Family meal history
`GET /api/families/:id/history?limit=10&offset=0`

Response `200`:
```json
{
  "success": true,
  "data": [
	    {
	      "id": "uuid",
	      "date": "2026-01-20",
	      "mealType": "DINNER",
	      "status": "PLANNING",
	      "cookUserId": "uuid",
	      "proposalCount": 0,
	      "voteCount": 0,
	      "votingClosedAt": null,
	      "finalizedAt": null,
	      "hasFinalDecision": false
	    }
  ]
}
```

---

## Meals (protected)

### Create meal
`POST /api/meals`

Request body:
```json
{
  "familyId": "uuid",
  "scheduledFor": "2026-01-20",
  "mealType": "DINNER",
  "constraints": {
    "maxBudget": 25,
    "dietaryRestrictions": ["Vegetarian"],
    "maxPrepTime": 45,
    "cuisinePreferences": ["Vietnamese"],
    "servings": 4
  }
}
```

Notes:
- `scheduledFor` accepts either `YYYY-MM-DD` or an ISO timestamp like `2026-01-22T12:00:00Z` (server normalizes to `YYYY-MM-DD`).
- Requires you to be a family `ADMIN` for the provided `familyId`.

Response `201`:
```json
{ "success": true, "data": { "id": "uuid", "familyId": "uuid", "scheduledFor": "2026-01-20", "mealType": "DINNER", "status": "PLANNING", "cookUserId": "uuid" } }
```

### List meals
`GET /api/meals?familyId=uuid&startDate=2026-01-01&endDate=2026-01-31&status=PLANNING`

Response `200`:
```json
{ "success": true, "data": [ { "id": "uuid", "scheduledFor": "2026-01-20", "mealType": "DINNER", "status": "PLANNING", "cookUserId": "uuid" } ] }
```

### Get meal
`GET /api/meals/:id`

Response `200`:
```json
{ "success": true, "data": { "id": "uuid", "familyId": "uuid", "scheduledFor": "2026-01-20", "mealType": "DINNER", "status": "PLANNING", "cookUserId": "uuid" } }
```

### Update meal
`PATCH /api/meals/:id`

Notes:
- Requires you to be a family `ADMIN` for the meal’s family.
- Status transitions happen via the admin meal endpoints (`/api/admin/meals/...`), not this endpoint.

Request body (any subset):
```json
{ "scheduledFor": "2026-01-21", "mealType": "LUNCH", "constraints": { "maxBudget": 30 } }
```

Response `200`:
```json
{ "success": true, "data": { "id": "uuid", "status": "LOCKED", "cookUserId": "uuid" } }
```

### Delete meal (soft delete)
`DELETE /api/meals/:id`

Response `204 No Content`

### Meal summary (proposals + votes + decision)
`GET /api/meals/:id/summary`

Response `200` (shape):
```json
{
  "success": true,
  "data": {
    "meal": { "id": "uuid", "date": "2026-01-20", "mealType": "DINNER", "status": "PLANNING", "cookUserId": "uuid" },
    "proposals": [
      {
        "id": "uuid",
        "dishName": "Pho",
        "userId": "uuid",
        "userName": "Parent One",
        "voteStats": { "voteCount": 2, "averageRank": 1.5, "totalScore": 17 },
        "isSelected": false
      }
    ],
    "voteSummary": [],
    "finalDecision": null
  }
}
```

### Get my votes for a meal
`GET /api/meals/:id/votes/my-votes`

Response `200`:
```json
{
  "success": true,
  "data": [
    {
      "voteId": "uuid",
      "proposalId": "uuid",
      "dishName": "Pho",
      "rankPosition": 1
    },
    {
      "voteId": "uuid",
      "proposalId": "uuid",
      "dishName": "Spring Rolls",
      "rankPosition": 2
    }
  ]
}
```

Notes:
- Returns all votes the authenticated user has cast for proposals in the specified meal
- Results are ordered by rank position (ascending)
- Returns empty array if user hasn't voted yet

---

## Proposals (protected)

### Create proposal for a meal
`POST /api/meals/:mealId/proposals`

Request body:
```json
{
  "dishName": "Pho",
  "ingredients": "Noodles, broth...",
  "notes": "No peanuts",
  "extra": { "imageUrls": ["https://..."] }
}
```

Response `201`:
```json
{ "success": true, "data": { "id": "uuid", "mealId": "uuid", "userId": "uuid", "dishName": "Pho" } }
```

### List proposals for a meal
`GET /api/meals/:mealId/proposals`

Response `200`:
```json
{ "success": true, "data": [ { "id": "uuid", "mealId": "uuid", "userId": "uuid", "dishName": "Pho" } ] }
```

### Get proposal
`GET /api/proposals/:id`

Response `200`:
```json
{ "success": true, "data": { "id": "uuid", "mealId": "uuid", "userId": "uuid", "dishName": "Pho" } }
```

### Update proposal (owner only; meal must be PLANNING)
`PATCH /api/proposals/:id`

Request body (any subset):
```json
{ "notes": "Extra spicy" }
```

Response `200`:
```json
{ "success": true, "data": { "id": "uuid", "notes": "Extra spicy" } }
```

### Delete proposal (soft delete; owner only; meal must be PLANNING)
`DELETE /api/proposals/:id`

Response `204 No Content`

---

## Votes (protected)

### Cast/update vote for a proposal
`POST /api/proposals/:proposalId/votes`

Request body:
```json
{ "rankPosition": 1 }
```

Response `200`:
```json
{ "success": true, "data": { "id": "uuid", "proposalId": "uuid", "userId": "uuid", "rankPosition": 1 } }
```

### Bulk vote for a meal (submit all rankings at once)
`POST /api/meals/:id/votes/bulk`

Request body:
```json
{
  "votes": [
    { "proposalId": "uuid-1", "rankPosition": 1 },
    { "proposalId": "uuid-2", "rankPosition": 2 },
    { "proposalId": "uuid-3", "rankPosition": 3 }
  ]
}
```

Response `200`:
```json
{
  "success": true,
  "data": [
    { "id": "vote-uuid-1", "proposalId": "uuid-1", "userId": "uuid", "rankPosition": 1 },
    { "id": "vote-uuid-2", "proposalId": "uuid-2", "userId": "uuid", "rankPosition": 2 },
    { "id": "vote-uuid-3", "proposalId": "uuid-3", "userId": "uuid", "rankPosition": 3 }
  ]
}
```

Notes:
- Replaces all existing votes for the user in this meal with the new votes
- All proposals must belong to the specified meal
- Each rank position must be unique (no duplicates)
- Meal must be in `PLANNING` status
- At least one vote is required

### Delete vote
`DELETE /api/votes/:id`

Response `204 No Content`

---

## Admin: Families (protected)

These endpoints require you to be a family `ADMIN`.

### Update family
`PATCH /api/admin/families/:id`

Request body:
```json
{ "name": "New Family Name", "settings": { "defaultMaxBudget": 30 } }
```

Response `200`:
```json
{ "success": true, "data": { "id": "uuid", "name": "New Family Name" } }
```

### Add member
`POST /api/admin/families/:id/members`

Request body:
```json
{ "email": "member@example.com", "role": "MEMBER" }
```

Response `201`:
```json
{ "success": true, "data": { "familyId": "uuid", "userId": "uuid", "role": "MEMBER", "joinedAt": "..." } }
```

### Remove member
`DELETE /api/admin/families/:id/members/:memberId`

Response `204 No Content`

---

## Admin: Meals (protected)

These endpoints require you to be a family `ADMIN` for the meal’s family.

### Close voting
`POST /api/admin/meals/:id/close-voting`

Response `200`:
```json
{ "success": true, "data": { "id": "uuid", "status": "LOCKED", "votingClosedAt": "..." } }
```

### Reopen voting
`POST /api/admin/meals/:id/reopen-voting`

Response `200`:
```json
{ "success": true, "data": { "id": "uuid", "status": "PLANNING", "votingClosedAt": null } }
```

### Finalize meal
`POST /api/admin/meals/:id/finalize`

Request body:
```json
{ "selectedProposalIds": ["uuid-1", "uuid-2"], "cookUserId": "uuid", "reason": "Most votes" }
```

Response `200`:
```json
{ "success": true, "data": { "id": "uuid", "status": "COMPLETED", "finalizedAt": "...", "cookUserId": "uuid", "finalDecision": { "selectedProposalIds": ["uuid-1", "uuid-2"], "decidedByUserId": "uuid" } } }
```
