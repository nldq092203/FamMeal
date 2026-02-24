const request = require('supertest');
const { getApp, createTestUser } = require('./helpers');

describe('Auth API', () => {
  let app;

  beforeAll(() => {
    app = getApp();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user and return tokens', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: `reg_${Date.now()}@test.com`, password: 'StrongPass1!', username: `reg_${Date.now()}`, name: 'Reg User' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.userId).toBeDefined();
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      const user = await createTestUser();
      await request(app)
        .post('/api/auth/register')
        .send({ email: user.email, password: 'StrongPass1!', username: `dup_${Date.now()}`, name: 'Dup' })
        .expect(409);
    });

    it('should reject duplicate username', async () => {
      const user = await createTestUser();
      await request(app)
        .post('/api/auth/register')
        .send({ email: `dup_${Date.now()}@test.com`, password: 'StrongPass1!', username: user.username, name: 'Dup' })
        .expect(409);
    });

    it('should reject weak password', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: `weak_${Date.now()}@test.com`, password: '123', username: `weak_${Date.now()}`, name: 'Weak' })
        .expect(400);
    });

    it('should reject missing fields', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: `miss_${Date.now()}@test.com` })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const user = await createTestUser();
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: user.password })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should reject wrong password', async () => {
      const user = await createTestUser();
      await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: 'WrongPassword123!' })
        .expect(401);
    });

    it('should reject non-existent email', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'StrongPass1!' })
        .expect(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return new tokens with valid refresh token', async () => {
      const user = await createTestUser();
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: user.refreshToken })
        .expect(200);

      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
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

    it('should reject with invalid token', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should return success even for unknown email (security)', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'unknown@test.com' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should generate reset token for valid email', async () => {
      const user = await createTestUser();
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: user.email })
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
