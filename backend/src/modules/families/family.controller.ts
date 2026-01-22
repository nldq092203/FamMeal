import { FastifyRequest, FastifyReply } from 'fastify';
import { FamilyService } from './family.service';
import { CreateFamilyInput, UpdateFamilyInput, AddFamilyMemberInput, UpdateFamilyProfileInput, UpdateFamilySettingsInput } from './family.schema';
import { UnauthorizedError } from '@/shared/errors.js';

export class FamilyController {
  private familyService: FamilyService;

  constructor() {
    this.familyService = new FamilyService();
  }

  /**
   * POST /families - Create a new family
   */
  async createFamily(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const body = request.body as CreateFamilyInput;
    // User is attached by auth middleware
    const user = request.user;
    
    if (!user) {
      throw new UnauthorizedError();
    }
    
    const family = await this.familyService.createFamily(user.userId, body);

    return reply.status(201).send({
      success: true,
      data: family,
    });
  }

  /**
   * GET /families - List user's families
   */
  async getMyFamilies(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const user = request.user;
    
    if (!user) {
      throw new UnauthorizedError();
    }

    const families = await this.familyService.getUserFamilies(user.userId);

    return reply.send({
      success: true,
      data: families,
    });
  }

  /**
   * GET /families/:id - Get family details
   */
  async getFamily(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { id } = request.params as { id: string };
    const user = request.user;
    
    if (!user) {
      throw new UnauthorizedError();
    }

    const family = await this.familyService.getFamilyById(id, user.userId);

    return reply.send({
      success: true,
      data: family,
    });
  }

  /**
   * PATCH /families/:id - Update family
   */
  async updateFamily(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { id } = request.params as { id: string };
    const body = request.body as UpdateFamilyInput;
    const user = request.user;
    
    if (!user) {
      throw new UnauthorizedError();
    }

    const family = await this.familyService.updateFamily(id, user.userId, body);

    return reply.send({
      success: true,
      data: family,
    });
  }

  /**
   * PATCH /families/:id/profile - Update family profile (name/avatar)
   */
  async updateFamilyProfile(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { id } = request.params as { id: string };
    const body = request.body as UpdateFamilyProfileInput;
    const user = request.user;

    if (!user) {
      throw new UnauthorizedError();
    }

    const family = await this.familyService.updateFamilyProfile(id, user.userId, body);

    return reply.send({
      success: true,
      data: family,
    });
  }

  /**
   * PATCH /families/:id/settings - Update family settings only
   */
  async updateFamilySettings(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { id } = request.params as { id: string };
    const body = request.body as UpdateFamilySettingsInput;
    const user = request.user;

    if (!user) {
      throw new UnauthorizedError();
    }

    const family = await this.familyService.updateFamilySettings(id, user.userId, body);

    return reply.send({
      success: true,
      data: family,
    });
  }

  /**
   * POST /families/:id/members - Add member
   */
  async addMember(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { id } = request.params as { id: string };
    const body = request.body as AddFamilyMemberInput;
    const user = request.user;
    
    if (!user) {
      throw new UnauthorizedError();
    }

    const member = await this.familyService.addMember(id, user.userId, body);

    return reply.status(201).send({
      success: true,
      data: member,
    });
  }

  /**
   * DELETE /families/:id/members/:memberId - Remove member
   */
  async removeMember(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { id, memberId } = request.params as { id: string; memberId: string };
    const user = request.user;
    
    if (!user) {
      throw new UnauthorizedError();
    }

    await this.familyService.removeMember(id, user.userId, memberId);

    return reply.status(204).send();
  }
}
