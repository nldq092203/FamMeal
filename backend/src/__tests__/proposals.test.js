const request = require('supertest');
const { getApp, createTestUser, createTestFamily, addFamilyMember, createTestMeal, createTestProposal } = require('./helpers');

describe('Proposals API', () => {
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

  describe('POST /api/meals/:mealId/proposals (Create)', () => {
    it('MEMBER should create a proposal', async () => {
      const res = await request(app)
        .post(`/api/meals/${meal.id}/proposals`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .send({ dishName: 'Pasta Carbonara' })
        .expect(201);

      expect(res.body.data.dishName).toBe('Pasta Carbonara');
    });

    it('ADMIN should create a proposal', async () => {
      const res = await request(app)
        .post(`/api/meals/${meal.id}/proposals`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ dishName: 'Grilled Chicken' })
        .expect(201);

      expect(res.body.data.dishName).toBe('Grilled Chicken');
    });

    it('OUTSIDER should be blocked from creating proposals (RBAC)', async () => {
      await request(app)
        .post(`/api/meals/${meal.id}/proposals`)
        .set('Authorization', `Bearer ${outsider.accessToken}`)
        .send({ dishName: 'Outsider Dish' })
        .expect(403);
    });

    it('should reject proposal on LOCKED meal', async () => {
      const lockedMeal = await createTestMeal(admin.accessToken, family.id);
      await request(app)
        .post(`/api/admin/meals/${lockedMeal.id}/close-voting`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(200);

      await request(app)
        .post(`/api/meals/${lockedMeal.id}/proposals`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .send({ dishName: 'Late Dish' })
        .expect(400);
    });
  });

  describe('PATCH /api/proposals/:id (Update)', () => {
    it('OWNER should update own proposal', async () => {
      const proposal = await createTestProposal(member.accessToken, meal.id, { dishName: 'Original' });
      const res = await request(app)
        .patch(`/api/proposals/${proposal.id}`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .send({ dishName: 'Updated Dish' })
        .expect(200);

      expect(res.body.data.dishName).toBe('Updated Dish');
    });

    it('NON-OWNER should be blocked from updating (Ownership)', async () => {
      const proposal = await createTestProposal(member.accessToken, meal.id, { dishName: 'Member Dish' });
      await request(app)
        .patch(`/api/proposals/${proposal.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ dishName: 'Admin Override' })
        .expect(403);
    });
  });

  describe('DELETE /api/proposals/:id (Delete)', () => {
    it('OWNER should delete own proposal', async () => {
      const proposal = await createTestProposal(member.accessToken, meal.id, { dishName: 'To Delete' });
      await request(app)
        .delete(`/api/proposals/${proposal.id}`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .expect(200);
    });

    it('NON-OWNER should be blocked from deleting (Ownership)', async () => {
      const proposal = await createTestProposal(member.accessToken, meal.id, { dishName: 'Protected' });
      await request(app)
        .delete(`/api/proposals/${proposal.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(403);
    });
  });

  describe('GET /api/meals/:mealId/proposals (List)', () => {
    it('MEMBER should list proposals for a meal', async () => {
      const res = await request(app)
        .get(`/api/meals/${meal.id}/proposals`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
