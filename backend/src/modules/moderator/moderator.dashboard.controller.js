const service = require('./moderator.dashboard.service');
const { sendSuccess } = require('../../common/utils/response.util');

async function getDashboard(req, res, next) {
  try {
    const dashboard = await service.getDashboard();
    return sendSuccess(res, 200, dashboard);
  } catch (error) {
    return next(error);
  }
}

module.exports = { getDashboard };
