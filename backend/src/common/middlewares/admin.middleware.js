const { requireRole } = require('./role.middleware');

module.exports = {
  requireAdmin: requireRole('admin'),
  requireAdminOrModerator: requireRole('moderator')
};
