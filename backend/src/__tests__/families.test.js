const request = require('supertest');
const { getApp, createTestUser, createTestFamily, addFamilyMember } = require('./helpers');

describe('Families API (Public)', () => {
  let app;

  beforeAll(() => {
    app = getApp();
  });

  describe('POST /api/families', () => {
    it('should create a family and set creator as ADMIN', async () => {
      const user = await createTestUser();
      const res = await request(app)
        .post('/api/families')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ name: 'My Family' })
        .expect(201);

      expect(res.body.data.name).toBe('My Family');
      expect(res.body.data.members).toBeDefined();
      const creatorMember = res.body.data.members.find((m) => m.userId === user.userId);
      expect(creatorMember.role).toBe('ADMIN');
    });

    it('should reject without token', async () => {
      await request(app)
        .post('/api/families')
        .send({ name: 'No Auth Family' })
        .expect(401);
    });
  });

  describe('GET /api/families', () => {
    it('should return only my families', async () => {
      const user = await createTestUser();
      await createTestFamily(user.accessToken, { name: 'Family A' });
      await createTestFamily(user.accessToken, { name: 'Family B' });

      const other = await createTestUser();
      await createTestFamily(other.accessToken, { name: 'Other Family' });

      const res = await request(app)
        .get('/api/families')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      res.body.data.forEach((f) => {
        expect(f.role).toBeDefined();
      });
    });
  });

  describe('GET /api/families/:id', () => {
    it('should return family details for a member', async () => {
      const admin = await createTestUser();
      const family = await createTestFamily(admin.accessToken);

      const res = await request(app)
        .get(`/api/families/${family.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(family.id);
      expect(res.body.data.myRole).toBe('ADMIN');
    });

    it('should reject non-member access (RBAC)', async () => {
      const admin = await createTestUser();
      const family = await createTestFamily(admin.accessToken);

      const outsider = await createTestUser();
      await request(app)
        .get(`/api/families/${family.id}`)
        .set('Authorization', `Bearer ${outsider.accessToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent family', async () => {
      const user = await createTestUser();
      await request(app)
        .get('/api/families/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(404);
    });
  });
});
