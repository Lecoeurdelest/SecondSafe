const Report = require('./report.model');
const Product = require('../products/product.model');
const User = require('../users/user.model');
const { applySellingRestrictionToUser } = require('../../common/utils/seller-restriction.util');
const business = require('../../config/business');

const EVIDENCE_PATH = /^\/uploads\/evidence\/[\w-]+\/[\w.-]+\.(png|jpe?g|mp4)$/i;
const MAX_EVIDENCE_PER_SUBMISSION = 5;

// Evidence must reference files stored by the evidence upload endpoint.
function normalizeEvidence(files) {
  if (files === undefined || files === null) return [];
  if (!Array.isArray(files)) throw new Error('Danh sách bằng chứng không hợp lệ');
  const paths = files.map(file => String(file || '').trim()).filter(Boolean);
  if (paths.length > MAX_EVIDENCE_PER_SUBMISSION) {
    throw new Error(`Tối đa ${MAX_EVIDENCE_PER_SUBMISSION} tệp bằng chứng cho mỗi lần gửi`);
  }
  if (!paths.every(file => EVIDENCE_PATH.test(file))) {
    throw new Error('Tệp bằng chứng không hợp lệ. Chỉ chấp nhận PNG, JPG/JPEG hoặc MP4 đã tải lên hệ thống.');
  }
  return paths;
}

function requireText(value, message) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw new Error(message);
  return text;
}

const USER_AUTO_SUSPEND_REPORT_THRESHOLD = business.reportRestrictionThreshold;

async function tryAutoSuspendByReportThreshold(reportedUserId) {
  if (!reportedUserId) {
    return false;
  }

  const user = await User.findById(reportedUserId);
  if (!user || user.role === 'admin' || user.isSellingRestricted) {
    return false;
  }

  const reportCount = await Report.countDocuments({
    reportedUserId,
    status: { $ne: 'dismissed' }
  });
  if (reportCount < USER_AUTO_SUSPEND_REPORT_THRESHOLD) {
    return false;
  }

  user.violationCount = Math.max(Number(user.violationCount || 0), USER_AUTO_SUSPEND_REPORT_THRESHOLD);

  await applySellingRestrictionToUser(user, {
    reason: `Tài khoản bị hạn chế quyền bán tự động do đã nhận từ ${USER_AUTO_SUSPEND_REPORT_THRESHOLD} báo cáo trở lên.`,
    source: 'report_threshold_auto'
  });

  return true;
}

/**
 * Service xu ly nghiep vu bao cao va tranh chap.
 */

/**
 * Tao bao cao san pham.
 */
async function createProductReport(reporterId, productId, reason, description, evidenceImages = []) {
  evidenceImages = normalizeEvidence(evidenceImages);
  description = requireText(description, 'Lý do và mô tả không được để trống');
  // Kiem tra du lieu dau vao.
  if (!reason || !description) {
    throw new Error('Lý do và mô tả không được để trống');
  }
  
  if (description.trim().length < 10) {
    throw new Error('Mô tả phải có ít nhất 10 ký tự');
  }
  
  // Lay san pham bi bao cao.
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new Error('Sản phẩm không tồn tại');
  }
  
  // Khong cho bao cao bai dang cua chinh minh.
  if (product.seller.toString() === reporterId.toString()) {
    throw new Error('Bạn không thể báo cáo sản phẩm của chính mình');
  }
  
  // Chan bao cao trung khi report truoc chua xu ly xong.
  const existingReport = await Report.findOne({
    reporterId: reporterId,
    productId: productId
  });
  
  if (existingReport) {
    throw new Error('Bạn đã báo cáo sản phẩm này rồi');
  }
  
  // Tao ban ghi bao cao.
  const report = await Report.create({
    reporterId: reporterId,
    reportedUserId: product.seller,
    productId: productId,
    reportType: 'product',
    reason: reason,
    description: description.trim(),
    evidenceImages: evidenceImages,
    status: 'pending'
  });
  
  // Bo sung thong tin lien quan de tra ve frontend.
  await report.populate([
    { path: 'reporterId', select: 'fullName email' },
    { path: 'reportedUserId', select: 'fullName email' },
    { path: 'productId', select: 'title price images' }
  ]);

  await tryAutoSuspendByReportThreshold(report.reportedUserId?._id || report.reportedUserId);
  
  return report;
}

/**
 * Tao bao cao nguoi dung.
 */
async function createUserReport(reporterId, reportedUserId, reason, description, evidenceImages = []) {
  evidenceImages = normalizeEvidence(evidenceImages);
  description = requireText(description, 'Lý do và mô tả không được để trống');
  // Kiem tra du lieu dau vao.
  if (!reason || !description) {
    throw new Error('Lý do và mô tả không được để trống');
  }
  
  if (description.trim().length < 10) {
    throw new Error('Mô tả phải có ít nhất 10 ký tự');
  }
  
  // Khong cho tu bao cao chinh minh.
  if (reporterId.toString() === reportedUserId.toString()) {
    throw new Error('Bạn không thể báo cáo chính mình');
  }
  
  // Xac nhan user bi bao cao ton tai.
  const reportedUser = await User.findById(reportedUserId);
  if (!reportedUser) {
    throw new Error('Người dùng không tồn tại');
  }
  
  // Tao ban ghi bao cao.
  const report = await Report.create({
    reporterId: reporterId,
    reportedUserId: reportedUserId,
    reportType: 'user',
    reason: reason,
    description: description.trim(),
    evidenceImages: evidenceImages,
    status: 'pending'
  });
  
  // Bo sung thong tin lien quan de tra ve frontend.
  await report.populate([
    { path: 'reporterId', select: 'fullName email' },
    { path: 'reportedUserId', select: 'fullName email' }
  ]);

  await tryAutoSuspendByReportThreshold(report.reportedUserId?._id || report.reportedUserId);
  
  return report;
}

/**
 * Lay danh sach bao cao theo bo loc + phan trang.
 */
async function getReports(filters = {}, pagination = {}) {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 20;
  const skip = (page - 1) * limit;
  
  const query = {};
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.reportType) {
    query.reportType = filters.reportType;
  }
  
  if (filters.reporterId) {
    query.reporterId = filters.reporterId;
  }
  
  if (filters.reportedUserId) {
    query.reportedUserId = filters.reportedUserId;
  }
  
  const reports = await Report.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('reporterId', 'fullName email avatar')
    .populate('reportedUserId', 'fullName email avatar')
    .populate('productId', 'title price images status');
  
  const total = await Report.countDocuments(query);
  
  return {
    reports,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Lay chi tiet 1 bao cao.
 */
async function getReportById(reportId, requester) {
  const report = await Report.findById(reportId)
    .populate('reporterId', 'fullName email avatar')
    .populate('reportedUserId', 'fullName email avatar')
    .populate('productId', 'title price images status description')
    .populate('moderatorId', 'fullName email');

  if (!report) {
    throw new Error('Báo cáo không tồn tại');
  }

  return reportViewFor(report, requester);
}

// INV-05: the reporter and staff read the whole report; the reported user reads it without anything
// that identifies the reporter, and nobody else reads it at all.
function reportViewFor(report, requester) {
  if (!requester || ['moderator', 'admin'].includes(requester.role)) return report;
  const viewerId = String(requester.userId);
  if (String(report.reporterId?._id || report.reporterId) === viewerId) return report;
  if (String(report.reportedUserId?._id || report.reportedUserId) !== viewerId) {
    throw Object.assign(new Error('Bạn không có quyền xem báo cáo này'), { statusCode: 403 });
  }
  const raw = typeof report.toObject === 'function' ? report.toObject() : { ...report };
  for (const field of ['reporterId', 'evidenceImages', 'moderatorNotes', 'moderatorReply']) delete raw[field];
  return raw;
}

/**
 * Lay bao cao do user hien tai tao.
 */
async function getUserReports(userId, pagination = {}) {
  return getReports({ reporterId: userId }, pagination);
}

module.exports = {
  createProductReport,
  createUserReport,
  getReports,
  getReportById,
  getUserReports
};
