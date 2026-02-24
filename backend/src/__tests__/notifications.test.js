const request = require('supertest');
const { getApp, createTestUser, createTestFamily, addFamilyMember } = require('./helpers');
const { Notification } = require('../db/models');

describe('Notifications API', () => {
  let app, admin, member, outsider, family;

  beforeAll(async () => {
    app = getApp();
    admin = await createTestUser();
    member = await createTestUser();
    outsider = await createTestUser();
    family = await createTestFamily(admin.accessToken);
    await addFamilyMember(admin.accessToken, family.id, member.userId, 'MEMBER');

    await Notification.bulkCreate([
      { userId: member.userId, familyId: family.id, type: 1, refId: family.id, isRead: false },
      { userId: member.userId, familyId: family.id, type: 2, refId: family.id, isRead: false },
      { userId: member.userId, familyId: family.id, type: 3, refId: family.id, isRead: true },
    ]);
  });

  describe('GET /api/families/:familyId/notifications (List)', () => {
    it('MEMBER should list notifications', async () => {
      const res = await request(app)
        .get(`/api/families/${family.id}/notifications`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(3);
    });

    it('OUTSIDER should be blocked (RBAC)', async () => {
      await request(app)
        .get(`/api/families/${family.id}/notifications`)
        .set('Authorization', `Bearer ${outsider.accessToken}`)
        .expect(403);
    });

    it('should reject without token', async () => {
      await request(app)
        .get(`/api/families/${family.id}/notifications`)
        .expect(401);
    });
  });

  describe('GET /api/families/:familyId/notifications/unread-count', () => {
    it('MEMBER should get unread count', async () => {
      const res = await request(app)
        .get(`/api/families/${family.id}/notifications/unread-count`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .expect(200);

      expect(res.body.data.count).toBeGreaterThanOrEqual(2);
    });

    it('OUTSIDER should be blocked (RBAC)', async () => {
      await request(app)
        .get(`/api/families/${family.id}/notifications/unread-count`)
        .set('Authorization', `Bearer ${outsider.accessToken}`)
        .expect(403);
    });
  });

  describe('POST /api/families/:familyId/notifications/:id/read (Mark Read)', () => {
    it('MEMBER should mark a notification as read', async () => {
      const notifications = await Notification.findAll({
        where: { userId: member.userId, familyId: family.id, isRead: false },
      });

      if (notifications.length > 0) {
        await request(app)
          .post(`/api/families/${family.id}/notifications/${notifications[0].id}/read`)
          .set('Authorization', `Bearer ${member.accessToken}`)
          .expect(200);
      }
    });

    it('OUTSIDER should be blocked from marking as read (RBAC)', async () => {
      await request(app)
        .post(`/api/families/${family.id}/notifications/00000000-0000-0000-0000-000000000000/read`)
        .set('Authorization', `Bearer ${outsider.accessToken}`)
        .expect(403);
    });
  });

  describe('POST /api/families/:familyId/notifications/read-all (Mark All Read)', () => {
    it('MEMBER should mark all as read', async () => {
      await request(app)
        .post(`/api/families/${family.id}/notifications/read-all`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .expect(200);

      const unread = await Notification.count({
        where: { userId: member.userId, familyId: family.id, isRead: false },
      });
      expect(unread).toBe(0);
    });

    it('OUTSIDER should be blocked from marking all as read (RBAC)', async () => {
      await request(app)
        .post(`/api/families/${family.id}/notifications/read-all`)
        .set('Authorization', `Bearer ${outsider.accessToken}`)
        .expect(403);
    });
  });
});
