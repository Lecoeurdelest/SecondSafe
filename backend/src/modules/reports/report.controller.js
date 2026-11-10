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

module.exports = {
  createProductReport,
  createUserReport,
  getReportById,
  getMyReports
};