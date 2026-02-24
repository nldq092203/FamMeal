const request = require('supertest');
const { getApp, createTestUser } = require('./helpers');

describe('Users API', () => {
  let app;

  beforeAll(() => {
    app = getApp();
  });

  describe('GET /api/users/me (via /api/auth/me)', () => {
    it('should return own profile', async () => {
      const user = await createTestUser();
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(user.userId);
      expect(res.body.data.email).toBe(user.email);
      expect(res.body.data.password).toBeUndefined();
    });

    it('should reject without token', async () => {
      await request(app).get('/api/auth/me').expect(401);
    });
  });

  describe('PATCH /api/users/:id (Update)', () => {
    it('should update own profile', async () => {
      const user = await createTestUser();
      const res = await request(app)
        .patch(`/api/users/${user.userId}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(res.body.data.name).toBe('Updated Name');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      const user = await createTestUser();
      const viewer = await createTestUser();
      const res = await request(app)
        .get(`/api/users/${user.userId}`)
        .set('Authorization', `Bearer ${viewer.accessToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(user.userId);
    });

    it('should return 404 for non-existent user', async () => {
      const viewer = await createTestUser();
      await request(app)
        .get('/api/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${viewer.accessToken}`)
        .expect(404);
    });

    it('should reject invalid UUID', async () => {
      const viewer = await createTestUser();
      await request(app)
        .get('/api/users/not-a-uuid')
        .set('Authorization', `Bearer ${viewer.accessToken}`)
        .expect(400);
    });
  });

  describe('GET /api/users/suggest', () => {
    it('should return suggestions when searching', async () => {
      await createTestUser({ name: 'UniqueSearchName' });
      const viewer = await createTestUser();
      const res = await request(app)
        .get('/api/users/suggest?q=Unique')
        .set('Authorization', `Bearer ${viewer.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should reject without q param', async () => {
      const viewer = await createTestUser();
      await request(app)
        .get('/api/users/suggest')
        .set('Authorization', `Bearer ${viewer.accessToken}`)
        .expect(400);
    });
  });
});
