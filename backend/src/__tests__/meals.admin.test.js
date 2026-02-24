const request = require('supertest');
const { getApp, createTestUser, createTestFamily, addFamilyMember, createTestMeal } = require('./helpers');

describe('Meals Admin API (RBAC)', () => {
  let app, admin, member, outsider, family;

  beforeAll(async () => {
    app = getApp();
    admin = await createTestUser();
    member = await createTestUser();
    outsider = await createTestUser();
    family = await createTestFamily(admin.accessToken);
    await addFamilyMember(admin.accessToken, family.id, member.userId, 'MEMBER');
  });

  describe('POST /api/admin/meals (Create Meal)', () => {
    it('ADMIN should create a meal', async () => {
      const res = await request(app)
        .post('/api/admin/meals')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ familyId: family.id, scheduledFor: new Date(Date.now() + 86400000).toISOString(), mealType: 'DINNER' })
        .expect(201);

      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('PLANNING');
    });

    it('MEMBER should be blocked from creating meals (RBAC)', async () => {
      await request(app)
        .post('/api/admin/meals')
        .set('Authorization', `Bearer ${member.accessToken}`)
        .send({ familyId: family.id, scheduledFor: new Date(Date.now() + 86400000).toISOString(), mealType: 'DINNER' })
        .expect(403);
    });

    it('OUTSIDER should be blocked from creating meals (RBAC)', async () => {
      await request(app)
        .post('/api/admin/meals')
        .set('Authorization', `Bearer ${outsider.accessToken}`)
        .send({ familyId: family.id, scheduledFor: new Date(Date.now() + 86400000).toISOString(), mealType: 'DINNER' })
        .expect(403);
    });
  });

  describe('PATCH /api/admin/meals/:id (Update Meal)', () => {
    it('ADMIN should update a meal', async () => {
      const meal = await createTestMeal(admin.accessToken, family.id);
      const res = await request(app)
        .patch(`/api/admin/meals/${meal.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ mealType: 'LUNCH' })
        .expect(200);

      expect(res.body.data.mealType).toBe('LUNCH');
    });

    it('MEMBER should be blocked from updating meals (RBAC)', async () => {
      const meal = await createTestMeal(admin.accessToken, family.id);
      await request(app)
        .patch(`/api/admin/meals/${meal.id}`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .send({ mealType: 'LUNCH' })
        .expect(403);
    });
  });

  describe('POST /api/admin/meals/:id/close-voting (State Machine)', () => {
    it('ADMIN should close voting on PLANNING meal', async () => {
      const meal = await createTestMeal(admin.accessToken, family.id);
      const res = await request(app)
        .post(`/api/admin/meals/${meal.id}/close-voting`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(200);

      expect(res.body.data.status).toBe('LOCKED');
    });

    it('should reject closing voting on already LOCKED meal', async () => {
      const meal = await createTestMeal(admin.accessToken, family.id);
      await request(app)
        .post(`/api/admin/meals/${meal.id}/close-voting`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(200);

      await request(app)
        .post(`/api/admin/meals/${meal.id}/close-voting`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(400);
    });

    it('MEMBER should be blocked from closing voting (RBAC)', async () => {
      const meal = await createTestMeal(admin.accessToken, family.id);
      await request(app)
        .post(`/api/admin/meals/${meal.id}/close-voting`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .expect(403);
    });
  });

  describe('POST /api/admin/meals/:id/reopen-voting (State Machine)', () => {
    it('ADMIN should reopen voting on LOCKED meal', async () => {
      const meal = await createTestMeal(admin.accessToken, family.id);
      await request(app)
        .post(`/api/admin/meals/${meal.id}/close-voting`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(200);

      const res = await request(app)
        .post(`/api/admin/meals/${meal.id}/reopen-voting`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(200);

      expect(res.body.data.status).toBe('PLANNING');
    });

    it('should reject reopening voting on PLANNING meal', async () => {
      const meal = await createTestMeal(admin.accessToken, family.id);
      await request(app)
        .post(`/api/admin/meals/${meal.id}/reopen-voting`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(400);
    });
  });

  describe('POST /api/admin/meals/:id/finalize (State Machine)', () => {
    it('ADMIN should finalize a meal', async () => {
      const meal = await createTestMeal(admin.accessToken, family.id);
      const res = await request(app)
        .post(`/api/admin/meals/${meal.id}/finalize`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ reason: 'Best choice' })
        .expect(200);

      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.finalDecision).toBeDefined();
    });

    it('MEMBER should be blocked from finalizing meals (RBAC)', async () => {
      const meal = await createTestMeal(admin.accessToken, family.id);
      await request(app)
        .post(`/api/admin/meals/${meal.id}/finalize`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .send({ reason: 'I am just a member' })
        .expect(403);
    });
  });

  describe('DELETE /api/admin/meals/:id (Delete Meal)', () => {
    it('ADMIN should delete a meal', async () => {
      const meal = await createTestMeal(admin.accessToken, family.id);
      await request(app)
        .delete(`/api/admin/meals/${meal.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(200);
    });

    it('MEMBER should be blocked from deleting meals (RBAC)', async () => {
      const meal = await createTestMeal(admin.accessToken, family.id);
      await request(app)
        .delete(`/api/admin/meals/${meal.id}`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .expect(403);
    });
  });
});
