const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, PasswordResetToken } = require('../../db/models');
const { env } = require('../../config/env');
const { NotFoundError, ConflictError, UnauthorizedError, ValidationError } = require('../../shared/errors');
const { logger } = require('../../shared/logger');

const SALT_ROUNDS = 12;
const RESET_TOKEN_EXPIRY_MINUTES = 60;

async function register(data) {
  const existingUser = await User.findOne({ where: { email: data.email } });
  if (existingUser) throw new ConflictError('Email already registered');

  const existingUsername = await User.findOne({ where: { username: data.username } });
  if (existingUsername) throw new ConflictError('Username already taken');

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  const newUser = await User.create({
    email: data.email,
    password: hashedPassword,
    username: data.username,
    name: data.name,
  });

  const tokens = generateTokens({ userId: newUser.id, email: newUser.email });
  return { userId: newUser.id, tokens };
}

async function login(data) {
  const user = await User.findOne({ where: { email: data.email } });

  if (!user || user.deletedAt) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const tokens = generateTokens({ userId: user.id, email: user.email });
  return { userId: user.id, tokens };
}

async function refreshAccessToken(refreshToken) {
  try {
    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET, { algorithms: ['HS256'] });

    const user = await User.findByPk(payload.userId);
    if (!user || user.deletedAt) {
      throw new UnauthorizedError('User not found');
    }

    return generateTokens({ userId: user.id, email: user.email });
  } catch (_err) {
    throw new UnauthorizedError('Invalid refresh token');
  }
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
  } catch (_err) {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

async function getCurrentUser(userId) {
  const user = await User.findOne({
    where: { id: userId },
    attributes: ['id', 'email', 'username', 'name', 'avatarId', 'deletedAt'],
  });

  if (!user || user.deletedAt) {
    throw new NotFoundError('User not found');
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    avatarId: user.avatarId,
  };
}

async function forgotPassword(email) {
  const user = await User.findOne({ where: { email }, attributes: ['id'] });

  if (!user) {
    logger.info('Password reset requested for unknown email', { email });
    return { resetToken: null };
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

  await PasswordResetToken.create({
    userId: user.id,
    token,
    expiresAt,
  });

  logger.info('Password reset token generated', { userId: user.id });
  return { resetToken: token };
}

async function resetPassword(token, newPassword) {
  const record = await PasswordResetToken.findOne({
    where: {
      token,
      used: false,
      expiresAt: { [Op.gt]: new Date() },
    },
  });

  if (!record) {
    throw new ValidationError('Reset token is invalid or has expired.');
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await User.update(
    { password: hashedPassword, updatedAt: new Date() },
    { where: { id: record.userId } }
  );

  await PasswordResetToken.update(
    { used: true },
    { where: { id: record.id } }
  );

  logger.info('Password reset completed', { userId: record.userId });
}

function generateTokens(payload) {
  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    algorithm: 'HS256',
  });

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    algorithm: 'HS256',
  });

  return { accessToken, refreshToken };
}

module.exports = {
  register,
  login,
  refreshAccessToken,
  verifyAccessToken,
  getCurrentUser,
  forgotPassword,
  resetPassword,
};
