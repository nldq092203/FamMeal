const request = require('supertest');
const { getApp, createTestUser, createTestFamily, addFamilyMember, createTestMeal, createTestProposal } = require('./helpers');

describe('Votes API', () => {
  let app, admin, member, outsider, family, meal, proposal;

  beforeAll(async () => {
    app = getApp();
    admin = await createTestUser();
    member = await createTestUser();
    outsider = await createTestUser();
    family = await createTestFamily(admin.accessToken);
    await addFamilyMember(admin.accessToken, family.id, member.userId, 'MEMBER');
    meal = await createTestMeal(admin.accessToken, family.id);
    proposal = await createTestProposal(member.accessToken, meal.id, { dishName: 'Vote Target' });
  });

  describe('POST /api/proposals/:proposalId/votes (Cast Vote)', () => {
    it('MEMBER should cast a vote', async () => {
      const res = await request(app)
        .post(`/api/proposals/${proposal.id}/votes`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .send({ rankPosition: 1 })
        .expect(201);

      expect(res.body.data.rankPosition).toBe(1);
    });

    it('ADMIN (also a member) should cast a vote', async () => {
      const res = await request(app)
        .post(`/api/proposals/${proposal.id}/votes`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ rankPosition: 2 })
        .expect(201);

      expect(res.body.data.rankPosition).toBe(2);
    });

    it('OUTSIDER should be blocked from voting (RBAC)', async () => {
      await request(app)
        .post(`/api/proposals/${proposal.id}/votes`)
        .set('Authorization', `Bearer ${outsider.accessToken}`)
        .send({ rankPosition: 1 })
        .expect(403);
    });

    it('should reject vote on LOCKED meal', async () => {
      const lockedMeal = await createTestMeal(admin.accessToken, family.id);
      const lockedProposal = await createTestProposal(member.accessToken, lockedMeal.id, { dishName: 'Locked Dish' });

      await request(app)
        .post(`/api/admin/meals/${lockedMeal.id}/close-voting`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(200);

      await request(app)
        .post(`/api/proposals/${lockedProposal.id}/votes`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .send({ rankPosition: 1 })
        .expect(400);
    });
  });

  describe('POST /api/meals/:id/votes/bulk (Bulk Vote)', () => {
    it('MEMBER should bulk vote', async () => {
      const proposal2 = await createTestProposal(admin.accessToken, meal.id, { dishName: 'Bulk Target' });
      const res = await request(app)
        .post(`/api/meals/${meal.id}/votes/bulk`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .send({
          votes: [
            { proposalId: proposal.id, rankPosition: 1 },
            { proposalId: proposal2.id, rankPosition: 2 },
          ],
        })
        .expect(201);

      expect(res.body.data.length).toBe(2);
    });

    it('OUTSIDER should be blocked from bulk voting (RBAC)', async () => {
      await request(app)
        .post(`/api/meals/${meal.id}/votes/bulk`)
        .set('Authorization', `Bearer ${outsider.accessToken}`)
        .send({ votes: [{ proposalId: proposal.id, rankPosition: 1 }] })
        .expect(403);
    });
  });

  describe('GET /api/meals/:id/votes/my-votes (Get My Votes)', () => {
    it('MEMBER should get own votes for a meal', async () => {
      const res = await request(app)
        .get(`/api/meals/${meal.id}/votes/my-votes`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('OUTSIDER should be blocked from getting votes (RBAC)', async () => {
      await request(app)
        .get(`/api/meals/${meal.id}/votes/my-votes`)
        .set('Authorization', `Bearer ${outsider.accessToken}`)
        .expect(403);
    });
  });

  describe('DELETE /api/votes/:id (Delete Vote)', () => {
    it('OWNER should delete own vote', async () => {
      const voteRes = await request(app)
        .post(`/api/proposals/${proposal.id}/votes`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .send({ rankPosition: 3 })
        .expect(201);

      await request(app)
        .delete(`/api/votes/${voteRes.body.data.id}`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .expect(200);
    });

    it('NON-OWNER should be blocked from deleting vote (Ownership)', async () => {
      const voteRes = await request(app)
        .post(`/api/proposals/${proposal.id}/votes`)
        .set('Authorization', `Bearer ${member.accessToken}`)
        .send({ rankPosition: 4 })
        .expect(201);

      await request(app)
        .delete(`/api/votes/${voteRes.body.data.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(403);
    });
  });
});
