const moderatorService = require("./moderator.service");
const { sendSuccess, sendError } = require("../../common/utils/response.util");
const { sendServiceError } = require('../../common/utils/service-error.util');

const REPORT_STATUS = ["pending", "reviewing", "resolved", "dismissed"];
const REPORT_TYPE = ["product", "user"];
// Danh sách quyết định xử lý báo cáo được phép từ moderator.
const REPORT_DECISIONS = ["remove_content", "warn_user", "ban_user", "reply_feedback"];
const ORDER_STATUS = ["awaiting_seller_confirmation", "awaiting_payment", "paid", "shipped", "completed", "cancelled", "disputed"];
const ORDER_STATUS_UPDATABLE = ["paid", "shipped", "completed", "cancelled", "disputed"];
const REVIEW_STATUS = ["active", "hidden", "reported"];
const REVIEW_ASSESSMENT = ["pending", "good", "bad"];

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

async function getOrders(req, res) {
  try {
    const { status, page, limit, keyword } = req.query;

    const statusError = ensureInList(status, ORDER_STATUS, "Trạng thái đơn hàng");
    if (statusError) return sendError(res, 400, statusError);

    const pageLimitError = ensureValidPageLimit(page, limit);
    if (pageLimitError) return sendError(res, 400, pageLimitError);

    const keywordError = ensureValidKeyword(keyword);
    if (keywordError) return sendError(res, 400, keywordError);

    const result = await moderatorService.getOrders({ status, keyword }, { page, limit });
    return sendSuccess(res, 200, result);
  } catch (error) {
    return sendServiceError(res, error, 400);
  }
}

async function getOrderById(req, res) {
  try {
    const { id } = req.params;
    const idError = ensureObjectId(id, "Mã đơn hàng");
    if (idError) return sendError(res, 400, idError);

    const order = await moderatorService.getOrderById(id);
    return sendSuccess(res, 200, order);
  } catch (error) {
    return sendServiceError(res, error, 404);
  }
}

async function forceCancelOrder(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const idError = ensureObjectId(id, "Mã đơn hàng");
    if (idError) return sendError(res, 400, idError);

    if (!reason || String(reason).trim().length < 10) {
      return sendError(res, 400, "Lý do hủy đơn phải có ít nhất 10 ký tự");
    }

    const order = await moderatorService.forceCancelOrder(
      id,
      req.user.userId,
      String(reason).trim()
    );
    return sendSuccess(res, 200, order, "Đã ép hủy đơn hàng thành công");
  } catch (error) {
    return sendServiceError(res, error, 400);
  }
}

// Cập nhật trạng thái đơn hàng theo luồng một chiều để tránh chuyển ngược trạng thái.
async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { nextStatus, note } = req.body || {};

    const idError = ensureObjectId(id, "Mã đơn hàng");
    if (idError) return sendError(res, 400, idError);

    if (!ORDER_STATUS_UPDATABLE.includes(nextStatus)) {
      return sendError(res, 400, "nextStatus không hợp lệ");
    }

    if (String(note || "").trim().length > 500) {
      return sendError(res, 400, "note không được vượt quá 500 ký tự");
    }

    const order = await moderatorService.updateOrderStatusByModerator(
      id,
      nextStatus,
      req.user.userId,
      String(note || "").trim()
    );

    return sendSuccess(res, 200, order, "Đã cập nhật trạng thái đơn hàng");
  } catch (error) {
    return sendServiceError(res, error, 400);
  }
}

async function getReviews(req, res) {
  try {
    const { status, assessment, page, limit, keyword } = req.query;

    const statusError = ensureInList(status, REVIEW_STATUS, "Trạng thái đánh giá");
    if (statusError) return sendError(res, 400, statusError);

    const assessmentError = ensureInList(assessment, REVIEW_ASSESSMENT, "Trạng thái đánh giá mod");
    if (assessmentError) return sendError(res, 400, assessmentError);

    const pageLimitError = ensureValidPageLimit(page, limit);
    if (pageLimitError) return sendError(res, 400, pageLimitError);

    const keywordError = ensureValidKeyword(keyword);
    if (keywordError) return sendError(res, 400, keywordError);

    const result = await moderatorService.getReviews(
      { status, assessment, keyword },
      { page, limit }
    );
    return sendSuccess(res, 200, result);
  } catch (error) {
    return sendServiceError(res, error, 400);
  }
}

async function hideReview(req, res) {
  try {
    const { reviewId } = req.params;
    const idError = ensureObjectId(reviewId, "Mã đánh giá");
    if (idError) return sendError(res, 400, idError);

    const review = await moderatorService.hideReview(reviewId);
    return sendSuccess(res, 200, review, "Đã ẩn đánh giá vi phạm");
  } catch (error) {
    return sendServiceError(res, error, 400);
  }
}

async function markSellerBadByReview(req, res) {
  try {
    const { reviewId } = req.params;
    const { note } = req.body || {};

    const idError = ensureObjectId(reviewId, "Mã đánh giá");
    if (idError) return sendError(res, 400, idError);

    const normalizedNote = String(note || '').trim();
    if (normalizedNote.length < 10) {
      return sendError(res, 400, "Vui lòng nhập ghi chú tối thiểu 10 ký tự");
    }
    if (normalizedNote.length > 500) {
      return sendError(res, 400, "Ghi chú không được vượt quá 500 ký tự");
    }

    const result = await moderatorService.markSellerBadByReview(
      reviewId,
      req.user.userId,
      normalizedNote
    );

    return sendSuccess(res, 200, result, "Đã đánh giá xấu và áp dụng xử lý cho người bán");
  } catch (error) {
    return sendServiceError(res, error, 400);
  }
}

async function markSellerGoodByReview(req, res) {
  try {
    const { reviewId } = req.params;
    const { note } = req.body || {};

    const idError = ensureObjectId(reviewId, "Mã đánh giá");
    if (idError) return sendError(res, 400, idError);

    const normalizedNote = String(note || '').trim();
    if (normalizedNote.length > 500) {
      return sendError(res, 400, "Ghi chú không được vượt quá 500 ký tự");
    }

    const result = await moderatorService.markSellerGoodByReview(
      reviewId,
      req.user.userId,
      normalizedNote
    );

    return sendSuccess(res, 200, result, "Đã duyệt đánh giá tốt");
  } catch (error) {
    return sendServiceError(res, error, 400);
  }
}

module.exports = {
  getRevenueReport,
  banUser,
  getReports,
  getReportById,
  resolveReport,
  getOrders,
  getOrderById,
  forceCancelOrder,
  updateOrderStatus,
  getReviews,
  hideReview,
  markSellerBadByReview,
  markSellerGoodByReview
};
