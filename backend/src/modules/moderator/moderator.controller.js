const moderatorService = require("./moderator.service");
const { sendSuccess, sendError } = require("../../common/utils/response.util");
const { sendServiceError } = require('../../common/utils/service-error.util');

const REPORT_STATUS = ["pending", "reviewing", "resolved", "dismissed"];
const REPORT_TYPE = ["product", "user"];
// Danh sách quyết định xử lý báo cáo được phép từ moderator.
const REPORT_DECISIONS = ["remove_content", "warn_user", "ban_user", "reply_feedback"];

function ensureObjectId(id, fieldName) {
  if (!id || !moderatorService.isValidObjectId(id)) {
    return `${fieldName} không hợp lệ`;
  }
  return null;
}

function ensureInList(value, list, fieldName) {
  if (!value) return null;
  if (!list.includes(value)) {
    return `${fieldName} không hợp lệ`;
  }
  return null;
}

function ensureValidPageLimit(page, limit) {
  // Validate phân trang để tránh truy vấn không hợp lệ hoặc quá tải.
  if (page !== undefined) {
    const pageNum = Number(page);
    if (!Number.isInteger(pageNum) || pageNum < 1) {
      return "page phải là số nguyên >= 1";
    }
  }

  if (limit !== undefined) {
    const limitNum = Number(limit);
    if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) {
      return "limit phải là số nguyên trong khoảng 1-100";
    }
  }

  return null;
}

function ensureValidKeyword(keyword) {
  // Validate độ dài keyword để đồng bộ rule với frontend.
  if (keyword === undefined) return null;
  if (String(keyword).trim().length > 100) {
    return "keyword không được vượt quá 100 ký tự";
  }
  return null;
}

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

async function banUser(req, res) {
  try {
    const { id } = req.params;
    const validationError = ensureObjectId(id, "Mã người dùng");
    if (validationError) return sendError(res, 400, validationError);

    const suspendedReason = String(req.body?.reason || "").trim();
    const result = await moderatorService.banUser(id, suspendedReason);
    return sendSuccess(res, 200, result, "Đã hạn chế quyền bán của người dùng");
  } catch (error) {
    return sendServiceError(res, error, 400);
  }
}

async function getReports(req, res) {
  try {
    const { status, reportType, page, limit, keyword } = req.query;

    const statusError = ensureInList(status, REPORT_STATUS, "Trạng thái báo cáo");
    if (statusError) return sendError(res, 400, statusError);

    const typeError = ensureInList(reportType, REPORT_TYPE, "Loại báo cáo");
    if (typeError) return sendError(res, 400, typeError);

    const pageLimitError = ensureValidPageLimit(page, limit);
    if (pageLimitError) return sendError(res, 400, pageLimitError);

    const keywordError = ensureValidKeyword(keyword);
    if (keywordError) return sendError(res, 400, keywordError);

    const result = await moderatorService.getReports(
      { status, reportType, keyword },
      { page, limit }
    );
    return sendSuccess(res, 200, result);
  } catch (error) {
    return sendServiceError(res, error, 400);
  }
}

async function getReportById(req, res) {
  try {
    const { reportId } = req.params;
    const idError = ensureObjectId(reportId, "Mã báo cáo");
    if (idError) return sendError(res, 400, idError);

    const report = await moderatorService.getReportById(reportId);
    return sendSuccess(res, 200, report);
  } catch (error) {
    return sendServiceError(res, error, 404);
  }
}
const REPORT_RESOLUTION_TEXT_FIELDS = ["moderatorNotes", "moderatorReply", "moderatorReplyToReportedUser"];

function reportResolutionError(reportId, body) {
  const idError = ensureObjectId(reportId, "Mã báo cáo");
  if (idError) return idError;
  if (!["resolved", "dismissed"].includes(body.status)) {
    return "status phải là resolved hoặc dismissed";
  }
  const decisionError = ensureInList(body.moderatorDecision, REPORT_DECISIONS, "moderatorDecision");
  if (decisionError) return decisionError;
  const tooLong = REPORT_RESOLUTION_TEXT_FIELDS.find((field) => String(body[field] || "").trim().length > 500);
  return tooLong ? `${tooLong} không được vượt quá 500 ký tự` : null;
}

async function resolveReport(req, res) {
  try {
    const { reportId } = req.params;
    const body = req.body || {};
    const validationError = reportResolutionError(reportId, body);
    if (validationError) return sendError(res, 400, validationError);

    const report = await moderatorService.resolveReport(reportId, req.user.userId, {
      status: body.status,
      moderatorDecision: body.moderatorDecision,
      moderatorNotes: String(body.moderatorNotes || "").trim(),
      moderatorReply: String(body.moderatorReply || "").trim(),
      moderatorReplyToReportedUser: String(body.moderatorReplyToReportedUser || "").trim()
    });

    return sendSuccess(res, 200, report, "Đã xử lý báo cáo thành công");
  } catch (error) {
    return sendServiceError(res, error, 400);
  }
}

module.exports = {
  getRevenueReport,
  banUser,
  getReports,
  getReportById,
  resolveReport
};
