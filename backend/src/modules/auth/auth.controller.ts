import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import { RegisterInput, LoginInput, RefreshTokenInput, ForgotPasswordInput, ResetPasswordInput } from './auth.schema';

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

  /**
   * POST /auth/forgot-password - Request password reset
   */
  async forgotPassword(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const body = request.body as ForgotPasswordInput;
    const { resetToken } = await this.authService.forgotPassword(body.email);

    // Always return success to avoid email enumeration
    return reply.send({
      success: true,
      data: {
        message: 'If an account with that email exists, a reset link has been generated.',
        ...(resetToken ? { resetToken } : {}),
      },
    });
  }

  /**
   * POST /auth/reset-password - Reset password using token
   */
  async resetPassword(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const body = request.body as ResetPasswordInput;
    await this.authService.resetPassword(body.token, body.newPassword);

    return reply.send({
      success: true,
      data: {
        message: 'Password has been reset successfully. You can now log in.',
      },
    });
  }
}
