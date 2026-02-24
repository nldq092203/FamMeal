const authService = require('./auth.service');

async function register(req, res) {
  const { userId, tokens } = await authService.register(req.body);
  res.status(201).json({ success: true, data: { userId, ...tokens } });
}

async function loginHandler(req, res) {
  const { userId, tokens } = await authService.login(req.body);
  res.json({ success: true, data: { userId, ...tokens } });
}

async function refresh(req, res) {
  const tokens = await authService.refreshAccessToken(req.body.refreshToken);
  res.json({ success: true, data: tokens });
}

async function me(req, res) {
  const profile = await authService.getCurrentUser(req.user.userId);
  res.json({ success: true, data: profile });
}

async function forgotPasswordHandler(req, res) {
  const { resetToken } = await authService.forgotPassword(req.body.email);
  res.json({
    success: true,
    data: {
      message: 'If an account with that email exists, a reset link has been generated.',
      ...(resetToken ? { resetToken } : {}),
    },
  });
}

async function resetPasswordHandler(req, res) {
  await authService.resetPassword(req.body.token, req.body.newPassword);
  res.json({
    success: true,
    data: { message: 'Password has been reset successfully. You can now log in.' },
  });
}

module.exports = { register, login: loginHandler, refresh, me, forgotPassword: forgotPasswordHandler, resetPassword: resetPasswordHandler };
