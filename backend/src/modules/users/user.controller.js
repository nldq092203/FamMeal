const userService = require('./user.service');

async function listUsers(req, res) {
  const result = await userService.listUsers(req.query);
  res.json({
    success: true,
    data: result.users,
    pagination: {
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
      totalItems: result.totalItems,
      hasNext: result.page < result.totalPages,
      hasPrevious: result.page > 1,
    },
  });
}

async function suggestUsers(req, res) {
  const users = await userService.suggestUsers(req.query.q, req.query.limit);
  res.json({ success: true, data: users });
}

async function getUser(req, res) {
  const user = await userService.getUserById(req.params.id);
  res.json({ success: true, data: user });
}

async function updateUser(req, res) {
  const user = await userService.updateUser(req.params.id, req.body, req.user.userId);
  res.json({ success: true, data: user });
}

async function deleteUser(req, res) {
  await userService.deleteUser(req.params.id, req.user.userId);
  res.json({ success: true, data: { message: 'User deleted' } });
}

module.exports = { listUsers, suggestUsers, getUser, updateUser, deleteUser };
