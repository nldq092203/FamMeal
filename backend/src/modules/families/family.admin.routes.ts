import { FastifyInstance } from 'fastify';
import { FamilyController } from './family.controller';
import { updateFamilySchema, updateFamilyProfileSchema, updateFamilySettingsSchema, addFamilyMemberSchema } from './family.schema';
import { requireFamilyAdmin } from '@/middleware/rbac.middleware';

/**
 * Admin-only family routes
 * All routes require ADMIN role in the family
 */
export async function familyAdminRoutes(app: FastifyInstance) {
  const controller = new FamilyController();

  // PATCH /admin/families/:id - Update family (legacy: profile + settings)
  app.patch('/:id', {
    preHandler: [requireFamilyAdmin],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
    },
    preValidation: async (request) => {
      request.body = updateFamilySchema.parse(request.body);
    },
  }, controller.updateFamily.bind(controller));

  // PATCH /admin/families/:id/profile - Update family profile (name + avatar)
  app.patch('/:id/profile', {
    preHandler: [requireFamilyAdmin],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
    },
    preValidation: async (request) => {
      request.body = updateFamilyProfileSchema.parse(request.body);
    },
  }, controller.updateFamilyProfile.bind(controller));

  // PATCH /admin/families/:id/settings - Update family settings only
  app.patch('/:id/settings', {
    preHandler: [requireFamilyAdmin],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
    },
    preValidation: async (request) => {
      request.body = updateFamilySettingsSchema.parse(request.body);
    },
  }, controller.updateFamilySettings.bind(controller));

  // POST /admin/families/:id/members - Add family member
  app.post('/:id/members', {
    preHandler: [requireFamilyAdmin],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
    },
    preValidation: async (request) => {
      request.body = addFamilyMemberSchema.parse(request.body);
    },
  }, controller.addMember.bind(controller));

  // DELETE /admin/families/:id/members/:memberId - Remove member
  app.delete('/:id/members/:memberId', {
    preHandler: [requireFamilyAdmin],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          memberId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, controller.removeMember.bind(controller));
}
