import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema/user.table';
import { env } from '@/config/env';
import { RegisterInput, LoginInput } from './auth.schema';
import { NotFoundError, ConflictError, UnauthorizedError } from '@/shared/errors';

const SALT_ROUNDS = 10;

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
