import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { eq, and, gt } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema/user.table';
import { passwordResetTokens } from '@/db/schema/password-reset-token.table';
import { env } from '@/config/env';
import { RegisterInput, LoginInput } from './auth.schema';
import { NotFoundError, ConflictError, UnauthorizedError, ValidationError } from '@/shared/errors';
import { logger } from '@/shared/logger';

const SALT_ROUNDS = 10;
const RESET_TOKEN_EXPIRY_MINUTES = 60; // 1 hour

export interface TokenPayload {
  userId: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

type CurrentUser = {
  id: string;
  email: string;
  username: string;
  name: string;
  avatarId: string;
};

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterInput): Promise<{ userId: string; tokens: AuthTokens }> {
    // Check if email already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email));

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Check if username already exists
    const [existingUsername] = await db
      .select()
      .from(users)
      .where(eq(users.username, data.username));

    if (existingUsername) {
      throw new ConflictError('Username already taken');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: data.email,
        password: hashedPassword,
        username: data.username,
        name: data.name,
      })
      .returning({ id: users.id, email: users.email });

    if (!newUser) {
      throw new Error('Failed to create user');
    }

    // Generate tokens
    const tokens = this.generateTokens({ userId: newUser.id, email: newUser.email });

    return { userId: newUser.id, tokens };
  }

  /**
   * Login user
   */
  async login(data: LoginInput): Promise<{ userId: string; tokens: AuthTokens }> {
    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email));

    if (!user || user.deletedAt) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate tokens
    const tokens = this.generateTokens({ userId: user.id, email: user.email });

    return { userId: user.id, tokens };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as TokenPayload;

      // Verify user still exists
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.userId));

      if (!user || user.deletedAt) {
        throw new UnauthorizedError('User not found');
      }

      // Generate new tokens
      return this.generateTokens({ userId: user.id, email: user.email });
    } catch (error) {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  /**
   * Verify access token and return payload
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  /**
   * Get current user profile (safe fields only)
   */
  async getCurrentUser(userId: string): Promise<CurrentUser> {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        name: users.name,
        avatarId: users.avatarId,
        deletedAt: users.deletedAt,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user || user.deletedAt) {
      throw new NotFoundError('User not found');
    }

    const { deletedAt: _deletedAt, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Request a password reset token.
   * Always returns success to avoid leaking whether the email exists.
   * The token is stored in the DB — in production you'd email it;
   * here we return it directly so the frontend can build the reset link.
   */
  async forgotPassword(email: string): Promise<{ resetToken: string | null }> {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email));

    if (!user) {
      // Don't reveal that the email doesn't exist
      logger.info({ email }, 'Password reset requested for unknown email');
      return { resetToken: null };
    }

    // Generate a cryptographically random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });

    logger.info({ userId: user.id }, 'Password reset token generated');

    // In a real app you'd send this via email.
    // For now we return it so the frontend can navigate to /reset-password?token=...
    return { resetToken: token };
  }

  /**
   * Validate a reset token and change the user's password.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const [record] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false),
          gt(passwordResetTokens.expiresAt, new Date()),
        ),
      );

    if (!record) {
      throw new ValidationError('Reset token is invalid or has expired.');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update user password
    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, record.userId));

    // Mark token as used
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, record.id));

    logger.info({ userId: record.userId }, 'Password reset completed');
  }

  /**
   * Generate access and refresh tokens
   */
  private generateTokens(payload: TokenPayload): AuthTokens {
    const accessToken = jwt.sign(
      payload,
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      payload,
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions
    );

    return { accessToken, refreshToken };
  }
}
