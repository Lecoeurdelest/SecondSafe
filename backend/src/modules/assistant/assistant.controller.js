const assistantService = require('./assistant.service');
const { sendSuccess } = require('../../common/utils/response.util');

async function ask(req, res, next) {
  try {
    return sendSuccess(res, 200, await assistantService.ask(req.body || {}));
  } catch (error) {
    return next(error);
  }
}

async function getModerationGuidance(req, res, next) {
  try {
    return sendSuccess(res, 200, await assistantService.getModerationGuidance(req.params.reportId));
  } catch (error) {
    return next(error);
  }
}

module.exports = { ask, getModerationGuidance };
