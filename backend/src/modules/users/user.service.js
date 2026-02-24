const { Op } = require('sequelize');
const { User } = require('../../db/models');
const { NotFoundError, ForbiddenError, ConflictError } = require('../../shared/errors');

async function listUsers({ page = 1, pageSize = 20, search }) {
  const where = { deletedAt: null };
  if (search) {
    where[Op.or] = [
      { username: { [Op.iLike]: `%${search}%` } },
      { name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { rows, count } = await User.findAndCountAll({
    where,
    attributes: ['id', 'email', 'username', 'name', 'avatarId', 'createdAt'],
    order: [['createdAt', 'DESC']],
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  return {
    users: rows,
    totalItems: count,
    page,
    pageSize,
    totalPages: Math.ceil(count / pageSize),
  };
}

async function suggestUsers(q, limit = 10) {
  const users = await User.findAll({
    where: {
      deletedAt: null,
      [Op.or]: [
        { username: { [Op.iLike]: `%${q}%` } },
        { name: { [Op.iLike]: `%${q}%` } },
      ],
    },
    attributes: ['id', 'username', 'name', 'avatarId'],
    limit,
  });

  return users;
}

async function getUserById(id) {
  const user = await User.findOne({
    where: { id, deletedAt: null },
    attributes: ['id', 'email', 'username', 'name', 'avatarId', 'createdAt', 'updatedAt'],
  });

  if (!user) throw new NotFoundError('User not found');
  return user;
}

async function updateUser(id, data, requesterId) {
  if (id !== requesterId) {
    throw new ForbiddenError('You can only update your own profile');
  }

  if (data.username) {
    const existing = await User.findOne({ where: { username: data.username, id: { [Op.ne]: id } } });
    if (existing) throw new ConflictError('Username already taken');
  }

  const [affectedCount] = await User.update(
    { ...data, updatedAt: new Date() },
    { where: { id, deletedAt: null } }
  );

  if (affectedCount === 0) throw new NotFoundError('User not found');

  return getUserById(id);
}

async function deleteUser(id, requesterId) {
  if (id !== requesterId) {
    throw new ForbiddenError('You can only delete your own account');
  }

  const [affectedCount] = await User.update(
    { deletedAt: new Date() },
    { where: { id, deletedAt: null } }
  );

  if (affectedCount === 0) throw new NotFoundError('User not found');
}

module.exports = { listUsers, suggestUsers, getUserById, updateUser, deleteUser };
