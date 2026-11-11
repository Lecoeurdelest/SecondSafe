const reportService = require('./report.service');
const { sendSuccess, sendError } = require('../../common/utils/response.util');
const { sendServiceError } = require('../../common/utils/service-error.util');

/**
 * Report & Dispute Controller
 * Handles report and dispute endpoints
 */

/**
 * Create a product report
 * POST /api/reports/product
 */
async function createProductReport(req, res) {
  try {
    const { productId, reason, description, evidenceImages } = req.body;
    const reporterId = req.user.userId;
    
    // Validate required fields
    if (!productId || !reason || !description) {
      return sendError(res, 400, 'Vui lòng điền đầy đủ thông tin');
    }
    
    const report = await reportService.createProductReport(
      reporterId, 
      productId, 
      reason, 
      description, 
      evidenceImages
    );
    
    sendSuccess(res, 200, report, 'Báo cáo sản phẩm thành công');
  } catch (error) {
    sendServiceError(res, error, 400);
  }
}

/**
 * Create a user report
 * POST /api/reports/user
 */
async function createUserReport(req, res) {
  try {
    const { reportedUserId, reason, description, evidenceImages } = req.body;
    const reporterId = req.user.userId;
    
    // Validate required fields
    if (!reportedUserId || !reason || !description) {
      return sendError(res, 400, 'Vui lòng điền đầy đủ thông tin');
    }
    
    const report = await reportService.createUserReport(
      reporterId, 
      reportedUserId, 
      reason, 
      description, 
      evidenceImages
    );
    
    sendSuccess(res, 200, report, 'Báo cáo người dùng thành công');
  } catch (error) {
    sendServiceError(res, error, 400);
  }
}

/**
 * Get reports (admin/moderator only)
 * GET /api/reports
 */
async function getReports(req, res) {
  try {
    const { status, reportType, page, limit } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (reportType) filters.reportType = reportType;
    
    const pagination = { page, limit };
    
    const result = await reportService.getReports(filters, pagination);
    
    sendSuccess(res, 200, result);
  } catch (error) {
    sendServiceError(res, error, 400);
  }
}

/**
 * Get report by ID
 * GET /api/reports/:reportId
 */
async function getReportById(req, res) {
  try {
    const { reportId } = req.params;
    
    const report = await reportService.getReportById(reportId, req.user);
    
    sendSuccess(res, 200, report);
  } catch (error) {
    sendServiceError(res, error, 404);
  }
}

/**
 * Create a dispute
 * POST /api/orders/:orderId/dispute
 */
async function createDispute(req, res) {
  try {
    const { orderId } = req.params;
    const { reason, description, evidenceImages } = req.body;
    const buyerId = req.user.userId;
    
    // Validate required fields
    if (!reason || !description) {
      return sendError(res, 400, 'Vui lòng điền đầy đủ thông tin');
    }
    
    if (!evidenceImages || evidenceImages.length === 0) {
      return sendError(res, 400, 'Vui lòng cung cấp ít nhất 1 tệp bằng chứng (ảnh hoặc video)');
    }
    
    const dispute = await reportService.createDispute(
      buyerId, 
      orderId, 
      reason, 
      description, 
      evidenceImages
    );
    
    sendSuccess(res, 200, dispute, 'Tạo khiếu nại thành công');
  } catch (error) {
    sendServiceError(res, error, 400);
  }
}

/**
 * Get disputes
 * GET /api/disputes
 */
async function getDisputes(req, res) {
  try {
    const { status, page, limit } = req.query;
    const userId = req.user.userId;
    
    const filters = {};
    if (status) filters.status = status;
    
    // Regular users can only see their own disputes
    filters.partyId = userId;
    
    const pagination = { page, limit };
    
    const result = await reportService.getDisputes(filters, pagination);
    
    sendSuccess(res, 200, result);
  } catch (error) {
    sendServiceError(res, error, 400);
  }
}

/**
 * Get dispute by ID
 * GET /api/disputes/:disputeId
 */
async function getDisputeById(req, res) {
  try {
    const { disputeId } = req.params;
    const userId = req.user.userId;
    
    const dispute = await reportService.getDisputeById(disputeId, userId);
    
    sendSuccess(res, 200, dispute);
  } catch (error) {
    sendServiceError(res, error, 404);
  }
}

/**
 * Add seller response to dispute
 * POST /api/disputes/:disputeId/respond
 */
async function addSellerResponse(req, res) {
  try {
    const { disputeId } = req.params;
    const { response, evidenceImages } = req.body;
    const sellerId = req.user.userId;
    
    // Validate required fields
    if (!response) {
      return sendError(res, 400, 'Vui lòng nhập phản hồi');
    }
    
    const dispute = await reportService.addSellerResponse(
      disputeId, 
      sellerId, 
      response, 
      evidenceImages
    );
    
    sendSuccess(res, 200, dispute, 'Phản hồi khiếu nại thành công');
  } catch (error) {
    sendServiceError(res, error, 400);
  }
}

/**
 * Add buyer follow-up evidence/notes to dispute
 * POST /api/disputes/:disputeId/buyer-follow-up
 */
async function addBuyerFollowUp(req, res) {
  try {
    const { disputeId } = req.params;
    const { note, evidenceImages } = req.body;
    const buyerId = req.user.userId;

    if (!note?.trim() && (!evidenceImages || evidenceImages.length === 0)) {
      return sendError(res, 400, 'Vui lòng nhập ghi chú hoặc tải lên ít nhất 1 tệp bằng chứng');
    }

    const dispute = await reportService.addBuyerFollowUp(
      disputeId,
      buyerId,
      note,
      evidenceImages
    );

    sendSuccess(res, 200, dispute, 'Đã bổ sung bằng chứng cho khiếu nại');
  } catch (error) {
    sendServiceError(res, error, 400);
  }
}

/**
 * Get current user's reports
 * GET /api/reports/my-reports
 */
async function getMyReports(req, res) {
  try {
    const userId = req.user.userId;
    const { page, limit } = req.query;
    
    const pagination = { page, limit };
    
    const result = await reportService.getUserReports(userId, pagination);
    
    sendSuccess(res, 200, result);
  } catch (error) {
    sendServiceError(res, error, 400);
  }
}

/**
 * Get current user's disputes
 * GET /api/disputes/my-disputes
 */
async function getMyDisputes(req, res) {
  try {
    const userId = req.user.userId;
    const { page, limit } = req.query;
    
    const pagination = { page, limit };
    
    const result = await reportService.getUserDisputes(userId, pagination);
    
    sendSuccess(res, 200, result);
  } catch (error) {
    sendServiceError(res, error, 400);
  }
}

/**
 * Xử lý báo cáo (Dành riêng cho Moderator/Admin)
 * PUT /api/reports/:reportId/resolve
 */
async function resolveReport(req, res) {
  try {
    const { reportId } = req.params;
    // Lấy các quyết định từ body của request do Moderator gửi lên
    const { status, moderatorDecision, moderatorNotes, moderatorReply, moderatorReplyToReportedUser } = req.body;
    // Lấy ID của Moderator đang thao tác
    const moderatorId = req.user.userId;

    // Kiểm tra xem Moderator đã gửi đủ thông tin bắt buộc chưa
    if (!status || !moderatorDecision) {
      return sendError(res, 400, 'Thiếu thông tin xử lý (status, hoặc moderatorDecision)');
    }

    // Gọi service để thực hiện việc cập nhật Database
    const report = await reportService.resolveReport(
      reportId, 
      moderatorId, 
      status, 
      moderatorDecision, 
      moderatorNotes,
      moderatorReply,
      moderatorReplyToReportedUser
    );

    sendSuccess(res, 200, report, 'Đã xử lý báo cáo thành công');
  } catch (error) {
    sendServiceError(res, error, 400);
  }
}

/**
 * Get dispute by order ID (accessible to buyer/seller)
 * GET /api/orders/:orderId/dispute
 */
async function getDisputeByOrderId(req, res) {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;
    const dispute = await reportService.getDisputeByOrderId(orderId, userId);
    sendSuccess(res, 200, dispute);
  } catch (error) {
    sendServiceError(res, error, 404);
  }
}

/**
 * Seller confirms return received (Th3)
 * POST /api/disputes/:disputeId/confirm-return
 */
async function confirmSellerReturn(req, res) {
  try {
    const { disputeId } = req.params;
    const sellerId = req.user.userId;
    const dispute = await reportService.confirmSellerReturn(disputeId, sellerId);
    sendSuccess(res, 200, dispute, 'Xác nhận nhận lại hàng thành công');
  } catch (error) {
    sendServiceError(res, error, 400);
  }
}

module.exports = {
  createProductReport,
  createUserReport,
  getReports,
  getReportById,
  createDispute,
  getDisputes,
  getDisputeById,
  getDisputeByOrderId,
  addSellerResponse,
  addBuyerFollowUp,
  confirmSellerReturn,
  getMyReports,
  getMyDisputes,
  resolveReport
};