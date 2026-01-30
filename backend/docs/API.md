# Mama Meal API (Frontend Reference)

## Overview

### Base URL
- Local: `http://localhost:3000`
- All endpoints below are relative to the base URL.

### Content Type
- Request: `Content-Type: application/json`
- Response: JSON (except `204 No Content`)

---

## Authentication

### Authorization
This API uses JWT Bearer tokens:

1. `POST /api/auth/login` returns `{ accessToken, refreshToken }`
2. Send access token on protected routes: `Authorization: Bearer <accessToken>`

### Public Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`

### Protected Endpoints
- All other `/api/*` endpoints require `Authorization` header
- `GET /api/auth/me`

---

## Response Format

### Success Response
Most endpoints return:
```json
{ "success": true, "data": {} }
```

**Paginated Response:**
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

### Error Response
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

### Error Codes
- `VALIDATION_ERROR` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `CONFLICT` (409)

**Note:** Some endpoints return `204 No Content` on success (empty body).

---

## API Endpoints

### Authentication

#### Register
`POST /api/auth/register` *(Public)*

**Request:**
```json
{
  "email": "parent@example.com",
  "password": "password123",
  "username": "parent1",
  "name": "Parent One"
}
```

**Response** `201`:
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

**Notes:**
- `username` must be unique

---

#### Login
`POST /api/auth/login` *(Public)*

**Request:**
```json
{ "email": "parent@example.com", "password": "password123" }
```

**Response** `200`:
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

---

#### Refresh Token
`POST /api/auth/refresh` *(Public)*

**Request:**
```json
{ "refreshToken": "..." }
```

**Response** `200`:
```json
{ "success": true, "data": { "accessToken": "...", "refreshToken": "..." } }
```

---

#### Get Current User
`GET /api/auth/me` *(Protected)*

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "parent@example.com",
    "username": "parent1",
    "name": "Parent One",
    "avatarId": "panda"
  }
}
```

---

### Users

#### Get User
`GET /api/users/:id` *(Protected)*

**Response** `200`:
```json
{ "success": true, "data": { "id": "uuid", "email": "...", "username": "...", "name": "...", "avatarId": "panda" } }
```

---

#### Suggest Users (Typeahead)
`GET /api/users/suggest?q=jo&limit=8` *(Protected)*

**Response** `200`:
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "username": "john", "displayName": "John Doe", "avatarId": "panda" }
  ]
}
```

**Notes:**
- Response is cached (10–60s) when Redis is enabled
- Endpoint is rate-limited
- `avatarId` is the avatar identifier in DB (e.g., `"panda"`)

---

#### Update User
`PATCH /api/users/:id` *(Protected)*

**Request:**
```json
{
  "email": "new@example.com",
  "username": "newname",
  "name": "New Name",
  "avatarId": "raccoon",
  "password": "newpassword123"
}
```

**Response** `200`:
```json
{ "success": true, "data": { "id": "uuid", "email": "new@example.com", "username": "newname", "name": "New Name", "avatarId": "raccoon" } }
```

---

#### Delete User
`DELETE /api/users/:id` *(Protected)*

**Response** `204 No Content`

---

### Families

#### Create Family
`POST /api/families` *(Protected)*

**Request:**
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

**Response** `201`:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Nguyen Family",
    "avatarId": "panda",
    "settings": {},
    "createdAt": "...",
    "updatedAt": "...",
    "deletedAt": null
  }
}
```

**Notes:**
- Creator automatically becomes ADMIN

---

#### List My Families
`GET /api/families` *(Protected)*

**Response** `200`:
```json
{ "success": true, "data": [ { "id": "uuid", "name": "...", "avatarId": "panda", "role": "ADMIN" } ] }
```

---

#### Get Family
`GET /api/families/:id` *(Protected)*

**Response** `200`:
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
      {
        "userId": "uuid",
        "username": "parent1",
        "name": "Parent One",
        "avatarId": "panda",
        "role": "ADMIN",
        "joinedAt": "2026-01-20T00:00:00.000Z"
      }
    ]
  }
}
```

---

#### Get Family Meal History
`GET /api/families/:id/history?limit=10&offset=0` *(Protected)*

**Response** `200`:
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

#### Update Family Profile *(Admin)*
`PATCH /api/admin/families/:id/profile`

**Request:**
```json
{ "name": "Nguyen Family", "avatarId": "panda" }
```

**Response** `200`:
```json
{ "success": true, "data": { "id": "uuid", "name": "Nguyen Family", "avatarId": "panda", "settings": {} } }
```

---

#### Update Family Settings *(Admin)*
`PATCH /api/admin/families/:id/settings`

**Request:**
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

**Response** `200`:
```json
{ "success": true, "data": { "id": "uuid", "name": "Nguyen Family", "avatarId": "panda", "settings": {} } }
```

---

#### Add Family Member *(Admin)*
`POST /api/admin/families/:id/members`

**Request:**
```json
{ "username": "parent2", "role": "MEMBER" }
```

Or:
```json
{ "email": "parent2@example.com", "role": "MEMBER" }
```

**Response** `201`:
```json
{ "success": true, "data": { "familyId": "uuid", "userId": "uuid", "role": "MEMBER", "joinedAt": "...", "avatarId": "panda" } }
```

---

#### Remove Family Member *(Admin)*
`DELETE /api/admin/families/:id/members/:memberId`

**Response** `204 No Content`

---

### Meals

#### Create Meal *(Protected – family ADMIN)*
`POST /api/admin/meals`

**Request:**
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

**Response** `201`:
```json
{ "success": true, "data": { "id": "uuid", "familyId": "uuid", "scheduledFor": "2026-01-20", "mealType": "DINNER", "status": "PLANNING", "cookUserId": "uuid" } }
```

**Notes:**
- `scheduledFor` accepts `YYYY-MM-DD` or ISO timestamp (normalized to `YYYY-MM-DD`)
- Requires family ADMIN role

---

#### List Meals
`GET /api/meals?familyId=uuid&startDate=2026-01-01&endDate=2026-01-31&status=PLANNING` *(Protected)*

**Response** `200`:
```json
{ "success": true, "data": [ { "id": "uuid", "scheduledFor": "2026-01-20", "mealType": "DINNER", "status": "PLANNING", "cookUserId": "uuid" } ] }
```

---

#### Get Meal
`GET /api/meals/:id` *(Protected)*

**Response** `200`:
```json
{ "success": true, "data": { "id": "uuid", "familyId": "uuid", "scheduledFor": "2026-01-20", "mealType": "DINNER", "status": "PLANNING", "cookUserId": "uuid" } }
```

---

#### Get Meal Summary
`GET /api/meals/:id/summary` *(Protected)*

**Response** `200`:
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

---

#### Get My Votes for Meal
`GET /api/meals/:id/votes/my-votes` *(Protected)*

**Response** `200`:
```json
{
  "success": true,
  "data": [
    { "voteId": "uuid", "proposalId": "uuid", "dishName": "Pho", "rankPosition": 1 },
    { "voteId": "uuid", "proposalId": "uuid", "dishName": "Spring Rolls", "rankPosition": 2 }
  ]
}
```

**Notes:**
- Returns all votes cast by authenticated user
- Ordered by rank position (ascending)
- Returns empty array if user hasn't voted

---

#### Update Meal *(Admin)*
`PATCH /api/admin/meals/:id`

**Request:**
```json
{ "scheduledFor": "2026-01-21", "mealType": "LUNCH", "constraints": { "maxBudget": 30 } }
```

**Response** `200`:
```json
{ "success": true, "data": { "id": "uuid", "status": "LOCKED", "cookUserId": "uuid" } }
```

---

#### Delete Meal *(Admin)*
`DELETE /api/admin/meals/:id`

**Response** `204 No Content`

---

### Proposals

#### Create Proposal
`POST /api/meals/:mealId/proposals` *(Protected)*

**Request:**
```json
{
  "dishName": "Pho",
  "ingredients": "Noodles, broth...",
  "notes": "No peanuts",
  "extra": { "imageUrls": ["https://..."] }
}
```

**Response** `201`:
```json
{ "success": true, "data": { "id": "uuid", "mealId": "uuid", "userId": "uuid", "dishName": "Pho" } }
```

---

#### List Proposals for Meal
`GET /api/meals/:mealId/proposals` *(Protected)*

**Response** `200`:
```json
{ "success": true, "data": [ { "id": "uuid", "mealId": "uuid", "userId": "uuid", "dishName": "Pho" } ] }
```

---

#### Get Proposal
`GET /api/proposals/:id` *(Protected)*

**Response** `200`:
```json
{ "success": true, "data": { "id": "uuid", "mealId": "uuid", "userId": "uuid", "dishName": "Pho" } }
```

---

#### Update Proposal
`PATCH /api/proposals/:id` *(Protected)*

**Request:**
```json
{ "notes": "Extra spicy" }
```

**Response** `200`:
```json
{ "success": true, "data": { "id": "uuid", "notes": "Extra spicy" } }
```

**Restrictions:**
- Owner only
- Meal must be in PLANNING status

---

#### Delete Proposal
`DELETE /api/proposals/:id` *(Protected)*

**Response** `204 No Content`

**Restrictions:**
- Owner only
- Meal must be in PLANNING status

---

### Votes

#### Cast/Update Vote
`POST /api/proposals/:proposalId/votes` *(Protected)*

**Request:**
```json
{ "rankPosition": 1 }
```

**Response** `200`:
```json
{ "success": true, "data": { "id": "uuid", "proposalId": "uuid", "userId": "uuid", "rankPosition": 1 } }
```

---

#### Bulk Vote
`POST /api/meals/:id/votes/bulk` *(Protected)*

**Request:**
```json
{
  "votes": [
    { "proposalId": "uuid-1", "rankPosition": 1 },
    { "proposalId": "uuid-2", "rankPosition": 2 },
    { "proposalId": "uuid-3", "rankPosition": 3 }
  ]
}
```

**Response** `200`:
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

**Notes:**
- Replaces all existing user votes for this meal
- All proposals must belong to specified meal
- Rank positions must be unique (no duplicates)
- Meal must be in PLANNING status
- At least one vote required

---

#### Delete Vote
`DELETE /api/votes/:id` *(Protected)*

**Response** `204 No Content`

---

## Admin Operations

All endpoints in this section require the authenticated user to be a family `ADMIN` for the relevant family.

### Close Voting
`POST /api/admin/meals/:id/close-voting` *(Admin)*

**Response** `200`:
```json
{ "success": true, "data": { "id": "uuid", "status": "LOCKED", "votingClosedAt": "..." } }
```

---

### Reopen Voting
`POST /api/admin/meals/:id/reopen-voting` *(Admin)*

**Response** `200`:
```json
{ "success": true, "data": { "id": "uuid", "status": "PLANNING", "votingClosedAt": null } }
```

---

### Finalize Meal
`POST /api/admin/meals/:id/finalize` *(Admin)*

**Request:**
```json
{
  "selectedProposalIds": ["uuid-1", "uuid-2"],
  "cookUserId": "uuid",
  "reason": "Most votes"
}
```

**Response** `200`:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "COMPLETED",
    "finalizedAt": "...",
    "cookUserId": "uuid",
    "finalDecision": {
      "selectedProposalIds": ["uuid-1", "uuid-2"],
      "decidedByUserId": "uuid"
    }
  }
}
```
