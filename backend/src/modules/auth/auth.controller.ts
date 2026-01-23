import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import { RegisterInput, LoginInput, RefreshTokenInput } from './auth.schema';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * POST /auth/register - Register new user
   */
  async register(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const body = request.body as RegisterInput;
    const { userId, tokens } = await this.authService.register(body);

    return reply.status(201).send({
      success: true,
      data: {
        userId,
        ...tokens,
      },
    });
  }

  /**
   * POST /auth/login - Login user
   */
  async login(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const body = request.body as LoginInput;
    const { userId, tokens } = await this.authService.login(body);

    return reply.send({
      success: true,
      data: {
        userId,
        ...tokens,
      },
    });
  }

  /**
   * POST /auth/refresh - Refresh access token
   */
  async refresh(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const body = request.body as RefreshTokenInput;
    const tokens = await this.authService.refreshAccessToken(body.refreshToken);

    return reply.send({
      success: true,
      data: tokens,
    });
  }

  /**
   * GET /auth/me - Get current user info
   */
  async me(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const user = request.user;

    if (!user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const profile = await this.authService.getCurrentUser(user.userId);

    return reply.send({
      success: true,
      data: profile,
    });
  }
}
