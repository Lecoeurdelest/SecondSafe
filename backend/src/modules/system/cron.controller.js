const cronService = require('../../services/cron.service');
const { sendSuccess, sendError } = require('../../common/utils/response.util');

async function runJob(req, res, next) {
  try {
    const outcome = await cronService.runJobOnDemand(req.params.job);
    if (!outcome) return sendError(res, 404, 'Không tìm thấy tác vụ định kỳ');
    return sendSuccess(res, 200, outcome, 'Đã chạy tác vụ định kỳ');
  } catch (error) {
    return next(error);
  }
}

module.exports = { runJob };
