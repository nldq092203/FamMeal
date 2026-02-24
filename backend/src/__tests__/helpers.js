const request = require('supertest');
const { buildApp } = require('../app');

let app;

function getApp() {
  if (!app) {
    app = buildApp();
  }
  return app;
}

let userCounter = 0;

async function createTestUser(overrides = {}) {
  userCounter++;
  const data = {
    email: overrides.email || `testuser${userCounter}_${Date.now()}@test.com`,
    password: overrides.password || 'TestPassword123!',
    username: overrides.username || `testuser${userCounter}_${Date.now()}`,
    name: overrides.name || `Test User ${userCounter}`,
    ...overrides,
  };

  const res = await request(getApp())
    .post('/api/auth/register')
    .send(data)
    .expect(201);

  return {
    userId: res.body.data.userId,
    accessToken: res.body.data.accessToken,
    refreshToken: res.body.data.refreshToken,
    email: data.email,
    password: data.password,
    username: data.username,
  };
}

async function createTestFamily(accessToken, overrides = {}) {
  const data = {
    name: overrides.name || `Test Family ${Date.now()}`,
    ...overrides,
  };

  const res = await request(getApp())
    .post('/api/families')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(data)
    .expect(201);

  return res.body.data;
}

async function addFamilyMember(adminToken, familyId, userId, role = 'MEMBER') {
  const res = await request(getApp())
    .post(`/api/admin/families/${familyId}/members`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ userId, role })
    .expect(201);

  return res.body.data;
}

async function createTestMeal(adminToken, familyId, overrides = {}) {
  const data = {
    familyId,
    scheduledFor: overrides.scheduledFor || new Date(Date.now() + 86400000).toISOString(),
    mealType: overrides.mealType || 'DINNER',
    ...overrides,
  };

  const res = await request(getApp())
    .post('/api/admin/meals')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(data)
    .expect(201);

  return res.body.data;
}

async function createTestProposal(accessToken, mealId, overrides = {}) {
  const data = {
    dishName: overrides.dishName || `Test Dish ${Date.now()}`,
    ...overrides,
  };

  const res = await request(getApp())
    .post(`/api/meals/${mealId}/proposals`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send(data)
    .expect(201);

  return res.body.data;
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

module.exports = {
  getApp,
  createTestUser,
  createTestFamily,
  addFamilyMember,
  createTestMeal,
  createTestProposal,
  authHeader,
};
