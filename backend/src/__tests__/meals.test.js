const request = require('supertest');
const { getApp, createTestUser, createTestFamily, addFamilyMember, createTestMeal } = require('./helpers');

describe('Meals API (Public)', () => {
  let app, admin, member, outsider, family, meal;

  beforeAll(async () => {
    app = getApp();
    admin = await createTestUser();
    member = await createTestUser();
    outsider = await createTestUser();
    family = await createTestFamily(admin.accessToken);
    await addFamilyMember(admin.accessToken, family.id, member.userId, 'MEMBER');
    meal = await createTestMeal(admin.accessToken, family.id);
  });

  describe('GET /api/meals?familyId=... (List)', () => {
    it('MEMBER should list meals', async () => {
      const res = await request(app)
        .get(`/api/meals?familyId=${family.id}`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('OUTSIDER should be blocked from listing meals (RBAC)', async () => {
      await request(app)
        .get(`/api/meals?familyId=${family.id}`)
        .set('Authorization', `Bearer ${outsider.accessToken}`)
        .expect(403);
    });

    it('should reject without token', async () => {
      await request(app)
        .get(`/api/meals?familyId=${family.id}`)
        .expect(401);
    });
  });

  describe('GET /api/meals/:id (Detail)', () => {
    it('MEMBER should get meal detail', async () => {
      const res = await request(app)
        .get(`/api/meals/${meal.id}`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(meal.id);
    });

    it('OUTSIDER should be blocked from getting meal detail (RBAC)', async () => {
      await request(app)
        .get(`/api/meals/${meal.id}`)
        .set('Authorization', `Bearer ${outsider.accessToken}`)
        .expect(403);
    });
  });

  describe('GET /api/meals/:id/summary', () => {
    it('MEMBER should get meal summary', async () => {
      const res = await request(app)
        .get(`/api/meals/${meal.id}/summary`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
