const request = require('supertest');
const { getApp, createTestUser, createTestFamily, addFamilyMember } = require('./helpers');

describe('Families Admin API (RBAC)', () => {
  let app, admin, member, outsider, family;

  beforeAll(async () => {
    app = getApp();
    admin = await createTestUser();
    member = await createTestUser();
    outsider = await createTestUser();
    family = await createTestFamily(admin.accessToken, { name: 'RBAC Test Family' });
    await addFamilyMember(admin.accessToken, family.id, member.userId, 'MEMBER');
  });

  describe('PATCH /api/admin/families/:id (Update Family)', () => {
    it('ADMIN should update family', async () => {
      const res = await request(app)
        .patch(`/api/admin/families/${family.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'Updated by Admin' })
        .expect(200);

      expect(res.body.data.name).toBe('Updated by Admin');
    });

    it('MEMBER should be blocked from updating family', async () => {
      await request(app)
        .patch(`/api/admin/families/${family.id}`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .send({ name: 'Updated by Member' })
        .expect(403);
    });

    it('OUTSIDER should be blocked from updating family', async () => {
      await request(app)
        .patch(`/api/admin/families/${family.id}`)
        .set('Authorization', `Bearer ${outsider.accessToken}`)
        .send({ name: 'Updated by Outsider' })
        .expect(403);
    });

    it('should reject without token', async () => {
      await request(app)
        .patch(`/api/admin/families/${family.id}`)
        .send({ name: 'No Auth' })
        .expect(401);
    });
  });

  describe('PATCH /api/admin/families/:id/profile (Update Profile)', () => {
    it('ADMIN should update family profile', async () => {
      await request(app)
        .patch(`/api/admin/families/${family.id}/profile`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'Profile Updated' })
        .expect(200);
    });

    it('MEMBER should be blocked from updating profile', async () => {
      await request(app)
        .patch(`/api/admin/families/${family.id}/profile`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .send({ name: 'Member Profile Update' })
        .expect(403);
    });
  });

  describe('PATCH /api/admin/families/:id/settings (Update Settings)', () => {
    it('ADMIN should update settings', async () => {
      await request(app)
        .patch(`/api/admin/families/${family.id}/settings`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ defaultMealType: 'LUNCH' })
        .expect(200);
    });

    it('MEMBER should be blocked from updating settings', async () => {
      await request(app)
        .patch(`/api/admin/families/${family.id}/settings`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .send({ defaultMealType: 'LUNCH' })
        .expect(403);
    });
  });

  describe('POST /api/admin/families/:id/members (Add Member)', () => {
    it('ADMIN should add a member', async () => {
      const newUser = await createTestUser();
      const res = await request(app)
        .post(`/api/admin/families/${family.id}/members`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ userId: newUser.userId, role: 'MEMBER' })
        .expect(201);

      expect(res.body.data.members).toBeDefined();
    });

    it('MEMBER should be blocked from adding members', async () => {
      const newUser = await createTestUser();
      await request(app)
        .post(`/api/admin/families/${family.id}/members`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .send({ userId: newUser.userId, role: 'MEMBER' })
        .expect(403);
    });

    it('OUTSIDER should be blocked from adding members', async () => {
      const newUser = await createTestUser();
      await request(app)
        .post(`/api/admin/families/${family.id}/members`)
        .set('Authorization', `Bearer ${outsider.accessToken}`)
        .send({ userId: newUser.userId, role: 'MEMBER' })
        .expect(403);
    });

    it('should reject duplicate member', async () => {
      await request(app)
        .post(`/api/admin/families/${family.id}/members`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ userId: member.userId, role: 'MEMBER' })
        .expect(409);
    });
  });

  describe('DELETE /api/admin/families/:id/members/:memberId (Remove Member)', () => {
    it('ADMIN should remove a member', async () => {
      const tempUser = await createTestUser();
      await addFamilyMember(admin.accessToken, family.id, tempUser.userId, 'MEMBER');

      await request(app)
        .delete(`/api/admin/families/${family.id}/members/${tempUser.userId}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(200);
    });

    it('MEMBER should be blocked from removing members', async () => {
      await request(app)
        .delete(`/api/admin/families/${family.id}/members/${admin.userId}`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .expect(403);
    });

    it('OUTSIDER should be blocked from removing members', async () => {
      await request(app)
        .delete(`/api/admin/families/${family.id}/members/${member.userId}`)
        .set('Authorization', `Bearer ${outsider.accessToken}`)
        .expect(403);
    });
  });

  describe('DELETE /api/admin/families/:id (Delete Family)', () => {
    it('MEMBER should be blocked from deleting family', async () => {
      await request(app)
        .delete(`/api/admin/families/${family.id}`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .expect(403);
    });

    it('OUTSIDER should be blocked from deleting family', async () => {
      await request(app)
        .delete(`/api/admin/families/${family.id}`)
        .set('Authorization', `Bearer ${outsider.accessToken}`)
        .expect(403);
    });

    it('ADMIN should delete family', async () => {
      const delAdmin = await createTestUser();
      const delFamily = await createTestFamily(delAdmin.accessToken, { name: 'To Delete' });

      await request(app)
        .delete(`/api/admin/families/${delFamily.id}`)
        .set('Authorization', `Bearer ${delAdmin.accessToken}`)
        .expect(200);
    });
  });
});
