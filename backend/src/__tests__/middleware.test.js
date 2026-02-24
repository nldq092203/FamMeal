const request = require('supertest');
const jwt = require('jsonwebtoken');
const { getApp, createTestUser } = require('./helpers');

describe('Middleware', () => {
  let app;

  beforeAll(() => {
    app = getApp();
  });

  describe('Auth Middleware', () => {
    it('should reject requests without Authorization header', async () => {
      await request(app).get('/api/auth/me').expect(401);
    });

    it('should reject malformed Bearer token', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'NotBearer token')
        .expect(401);
    });

    it('should reject expired JWT', async () => {
      const expiredToken = jwt.sign(
        { userId: 'fake-id', email: 'fake@test.com' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '0s', algorithm: 'HS256' }
      );

      await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('should reject JWT signed with wrong algorithm (HS384 instead of HS256)', async () => {
      const wrongAlgoToken = jwt.sign(
        { userId: 'fake-id', email: 'fake@test.com' },
        process.env.JWT_ACCESS_SECRET,
        { algorithm: 'HS384' }
      );

      await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${wrongAlgoToken}`)
        .expect(401);
    });

    it('should reject JWT signed with wrong secret', async () => {
      const wrongSecretToken = jwt.sign(
        { userId: 'fake-id', email: 'fake@test.com' },
        'totally_wrong_secret_key_here!!!!!',
        { algorithm: 'HS256' }
      );

      await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${wrongSecretToken}`)
        .expect(401);
    });

    it('should accept valid JWT and set req.user', async () => {
      const user = await createTestUser();
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(user.userId);
    });
  });

  describe('Validation Middleware', () => {
    it('should reject invalid body', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject invalid param (non-UUID id)', async () => {
      const user = await createTestUser();
      await request(app)
        .get('/api/users/not-a-uuid')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(400);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/nonexistent').expect(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Health Check', () => {
    it('should return 200 for /health', async () => {
      const res = await request(app).get('/health').expect(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.uptime).toBeDefined();
    });
  });
});
