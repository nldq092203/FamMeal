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

    it('should include meals on the end-date when using date-only to/start/end params', async () => {
      const scheduledFor = '2026-02-28T17:00:00.000Z';
      const created = await createTestMeal(admin.accessToken, family.id, { scheduledFor, mealType: 'OTHER' });

      const res1 = await request(app)
        .get(`/api/meals?familyId=${family.id}&from=2026-02-28&to=2026-02-28`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .expect(200);

      expect(res1.body.success).toBe(true);
      expect(res1.body.data.some((m) => m.id === created.id)).toBe(true);

      const res2 = await request(app)
        .get(`/api/meals?familyId=${family.id}&startDate=2026-02-28&endDate=2026-02-28`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .expect(200);

      expect(res2.body.success).toBe(true);
      expect(res2.body.data.some((m) => m.id === created.id)).toBe(true);
    });

    it('should treat an explicit time in to/endDate as an exact boundary (no end-of-day expansion)', async () => {
      const mealEarly = await createTestMeal(admin.accessToken, family.id, { scheduledFor: '2026-03-01T11:00:00.000Z' });
      const mealLate = await createTestMeal(admin.accessToken, family.id, { scheduledFor: '2026-03-01T17:00:00.000Z' });

      const res = await request(app)
        .get(`/api/meals?familyId=${family.id}&from=2026-03-01T00:00:00.000Z&to=2026-03-01T12:00:00.000Z`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .expect(200);

      const ids = res.body.data.map((m) => m.id);
      expect(ids).toContain(mealEarly.id);
      expect(ids).not.toContain(mealLate.id);
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
      expect(res.body.data).toHaveProperty('meal');
      expect(res.body.data).toHaveProperty('proposals');
    });
  });
});
