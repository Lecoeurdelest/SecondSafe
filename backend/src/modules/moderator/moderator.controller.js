const moderatorService = require("./moderator.service");
const { sendSuccess, sendError } = require("../../common/utils/response.util");
const { sendServiceError } = require('../../common/utils/service-error.util');

async function getRevenueReport(req, res) {
  try {
    const { from, to } = req.query || {};

    const filters = {};
    if (from) {
      const fromDate = new Date(from);
      if (Number.isNaN(fromDate.getTime())) {
        return sendError(res, 400, "from không hợp lệ (định dạng YYYY-MM-DD)");
      }
      fromDate.setHours(0, 0, 0, 0);
      filters.from = fromDate;
    }

    if (to) {
      const toDate = new Date(to);
      if (Number.isNaN(toDate.getTime())) {
        return sendError(res, 400, "to không hợp lệ (định dạng YYYY-MM-DD)");
      }
      toDate.setHours(23, 59, 59, 999);
      filters.to = toDate;
    }

    if (filters.from && filters.to && filters.from > filters.to) {
      return sendError(res, 400, "from không được lớn hơn to");
    }

    const report = await moderatorService.getRevenueReport(filters);
    return sendSuccess(res, 200, report);
  } catch (error) {
    return sendServiceError(res, error, 400);
  }
}

module.exports = {
  getRevenueReport
};
