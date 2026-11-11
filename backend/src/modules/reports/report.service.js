const mongoose = require('mongoose');
const Report = require('./report.model');
const Dispute = require('./dispute.model');
const Product = require('../products/product.model');
const Order = require('../orders/order.model');
const User = require('../users/user.model');
const notificationService = require('../notifications/notification.service');
const { applySellingRestrictionToUser } = require('../../common/utils/seller-restriction.util');
const business = require('../../config/business');

const EVIDENCE_PATH = /^\/uploads\/evidence\/[\w-]+\/[\w.-]+\.(png|jpe?g|mp4)$/i;
const MAX_EVIDENCE_PER_SUBMISSION = 5;
const SANCTION_LABELS = ['24 giờ', '1 tuần', '1 năm'];

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

// Nguong canh bao de xu ly manh tay voi bai dang.
const PRODUCT_WARN_THRESHOLD = 3;
const RESOLUTION_STATUSES = ['resolved', 'dismissed'];
const MODERATION_DECISIONS = ['remove_content', 'warn_user', 'ban_user', 'reply_feedback'];
const MAX_EVIDENCE_PER_SIDE = 10;
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

// Tinh muc phat theo moc 3/6/9 canh bao.
function getReportWarningPenalty(nextWarningCount) {
  const count = Math.max(0, nextWarningCount);
  const step = business.sanctionThresholds[0];
  const level = Math.min(Math.floor(count / step), business.sanctionDurationsMs.length);
  const shouldSuspendNow = count > 0 && count % step === 0;
  return {
    shouldSuspendNow,
    level,
    durationMs: shouldSuspendNow ? business.sanctionDurationsMs[level - 1] : 0,
    label: shouldSuspendNow ? SANCTION_LABELS[level - 1] : ''
  };
}

async function pushReportNotification(userId, title, message, reportId) {
  if (!userId) return;
  await notificationService.createNotification(userId, {
    type: 'report_update',
    title,
    message,
    reportId
  });
}

// Gui thong bao cap nhat tranh chap.
async function pushDisputeNotification(userId, title, message, disputeId) {
  if (!userId) return;
  await notificationService.createNotification(userId, {
    type: 'dispute_update',
    title,
    message,
    disputeId
  });
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
 * Tao tranh chap cho don hang.
 */
async function createDispute(buyerId, orderId, reason, description, evidenceImages = []) {
  const evidence = normalizeEvidence(evidenceImages);
  const text = requireText(description, 'Lý do và mô tả không được để trống');
  if (!reason) {
    throw new Error('Lý do và mô tả không được để trống');
  }
  if (text.length < 10 || text.length > 1000) {
    throw new Error('Mô tả phải có từ 10 đến 1000 ký tự');
  }
  if (!evidence.length) {
    throw new Error('Vui lòng cung cấp ít nhất 1 tệp bằng chứng (ảnh hoặc video)');
  }

  const session = await mongoose.startSession();
  try {
    let dispute;
    await session.withTransaction(async () => {
      dispute = await openDispute(session, buyerId, orderId, { reason, description: text, evidence });
    });
    await dispute.populate([
      { path: 'orderId', select: 'agreedAmount totalToPay status' },
      { path: 'buyerId', select: 'fullName email avatar' },
      { path: 'sellerId', select: 'fullName email avatar' },
      { path: 'productId', select: 'title price images' }
    ]);
    return dispute;
  } finally {
    await session.endSession();
  }
}

// The dispute and the order's move to `disputed` commit together, so automatic completion
// can never see a disputed order that still looks delivered (AC-DSP-01-2).
async function openDispute(session, buyerId, orderId, { reason, description, evidence }) {
  const order = await Order.findById(orderId).session(session);
  if (!order) {
    throw new Error('Đơn hàng không tồn tại');
  }
  if (order.buyerId.toString() !== buyerId.toString()) {
    throw new Error('Bạn không phải người mua của đơn hàng này');
  }
  if (!['shipped', 'delivered'].includes(order.status)) {
    throw new Error('Chỉ có thể khiếu nại đơn hàng đang giao hoặc đã giao đến nơi');
  }
  if (await Dispute.findOne({ orderId }).session(session)) {
    throw new Error('Đơn hàng này đã có khiếu nại rồi');
  }

  const [dispute] = await Dispute.create([{
    orderId,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
    productId: order.productId,
    reason,
    description,
    evidenceImages: evidence,
    status: 'pending',
    disputeConversation: [{
      senderRole: 'buyer',
      senderId: order.buyerId,
      content: description,
      evidenceFiles: evidence,
      createdAt: new Date()
    }]
  }], { session });

  order.status = 'disputed';
  await order.save({ session });
  return dispute;
}

/**
 * Lay danh sach tranh chap theo bo loc + phan trang.
 */
async function getDisputes(filters = {}, pagination = {}) {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 20;
  const skip = (page - 1) * limit;
  
  const query = {};
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.buyerId) {
    query.buyerId = filters.buyerId;
  }
  
  if (filters.sellerId) {
    query.sellerId = filters.sellerId;
  }

  if (filters.partyId) {
    query.$or = [{ buyerId: filters.partyId }, { sellerId: filters.partyId }];
  }
  
  const disputes = await Dispute.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('orderId', 'agreedAmount totalToPay status')
    .populate('buyerId', 'fullName email avatar')
    .populate('sellerId', 'fullName email avatar')
    .populate('productId', 'title price images');
  
  const total = await Dispute.countDocuments(query);
  
  return {
    disputes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Lay chi tiet 1 tranh chap, kem kiem tra quyen xem.
 */
async function getDisputeById(disputeId, userId) {
  const dispute = await Dispute.findById(disputeId)
    .populate('orderId', 'agreedAmount totalToPay status')
    .populate('buyerId', 'fullName email avatar phone')
    .populate('sellerId', 'fullName email avatar phone')
    .populate('productId', 'title price images description')
    .populate('moderatorId', 'fullName email')
    .populate('disputeConversation.senderId', 'fullName email avatar');
  
  if (!dispute) {
    throw new Error('Khiếu nại không tồn tại');
  }
  
  // Chi buyer/seller/moderator/admin moi duoc xem.
  if (userId) {
    const user = await User.findById(userId);
    const isAuthorized = 
      dispute.buyerId._id.toString() === userId.toString() ||
      dispute.sellerId._id.toString() === userId.toString() ||
      user.role === 'moderator' ||
      user.role === 'admin';
    
    if (!isAuthorized) {
      throw new Error('Bạn không có quyền xem khiếu nại này');
    }
  }
  
  return dispute;
}

// Loads a dispute for one of its parties while the moderator is investigating it.
async function requireInvestigatedDispute(disputeId, userId, partyField, messages) {
  const dispute = await Dispute.findById(disputeId);
  if (!dispute) {
    throw new Error('Khiếu nại không tồn tại');
  }
  if (dispute[partyField].toString() !== userId.toString()) {
    throw new Error(messages.notParty);
  }
  if (dispute.status === 'pending') {
    throw new Error(messages.pending);
  }
  if (dispute.status === 'resolved') {
    throw new Error('Khiếu nại này đã được xử lý rồi');
  }
  return dispute;
}

function appendEvidence(existing, added) {
  return [...(existing || []), ...added].slice(0, MAX_EVIDENCE_PER_SIDE);
}

function appendToConversation(dispute, senderRole, senderId, content, evidence, createdAt) {
  dispute.disputeConversation = [
    ...(dispute.disputeConversation || []),
    { senderRole, senderId, content, evidenceFiles: evidence, createdAt }
  ];
}

/**
 * Seller gui phan hoi cho tranh chap.
 */
async function addSellerResponse(disputeId, sellerId, response, evidenceImages = []) {
  const evidence = normalizeEvidence(evidenceImages);
  const text = requireText(response, 'Vui lòng nhập phản hồi');
  const dispute = await requireInvestigatedDispute(disputeId, sellerId, 'sellerId', {
    notParty: 'Bạn không phải người bán của đơn hàng này',
    pending: 'Moderator chưa bắt đầu điều tra khiếu nại. Vui lòng đợi moderator chuyển sang giai đoạn điều tra.'
  });

  dispute.sellerResponse = text;
  dispute.sellerEvidenceImages = appendEvidence(dispute.sellerEvidenceImages, evidence);
  dispute.sellerResponseUpdatedAt = new Date();
  appendToConversation(dispute, 'seller', sellerId, text, evidence, dispute.sellerResponseUpdatedAt);
  await dispute.save();

  return dispute;
}

/**
 * Buyer bo sung ghi chu/bang chung sau khi da mo tranh chap.
 * Chi cho bo sung khi moderator da chuyen investigating.
 */
async function addBuyerFollowUp(disputeId, buyerId, note = '', evidenceImages = []) {
  const evidence = normalizeEvidence(evidenceImages);
  const text = String(note || '').trim();
  if (!text && !evidence.length) {
    throw new Error('Vui lòng nhập ghi chú hoặc tải lên ít nhất 1 tệp bằng chứng');
  }
  const dispute = await requireInvestigatedDispute(disputeId, buyerId, 'buyerId', {
    notParty: 'Bạn không phải người mua của đơn hàng này',
    pending: 'Moderator chưa bắt đầu điều tra. Vui lòng đợi moderator xác nhận để gửi bằng chứng bổ sung.'
  });

  if (text) {
    dispute.buyerFollowUpNote = text;
  }
  dispute.buyerAdditionalEvidenceImages = appendEvidence(dispute.buyerAdditionalEvidenceImages, evidence);
  dispute.buyerFollowUpUpdatedAt = new Date();
  appendToConversation(dispute, 'buyer', buyerId, text || 'Người mua gửi bổ sung bằng chứng', evidence, dispute.buyerFollowUpUpdatedAt);
  await dispute.save();

  await pushDisputeNotification(
    dispute.moderatorId,
    'Người mua bổ sung bằng chứng',
    'Người mua vừa bổ sung ghi chú hoặc bằng chứng mới cho tranh chấp đang xử lý.',
    dispute._id
  );

  return getDisputeById(disputeId, buyerId);
}

/**
 * Lay bao cao do user hien tai tao.
 */
async function getUserReports(userId, pagination = {}) {
  return getReports({ reporterId: userId }, pagination);
}

/**
 * Lay tranh chap ma user la nguoi mua hoac nguoi ban.
 */
async function getUserDisputes(userId, pagination = {}) {
  return getDisputes({ partyId: userId }, pagination);
}

/**
 * Lay toan bo bao cao (dung cho moderator/admin).
 */
async function getAllReports(filters = {}, pagination = {}) {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 20;
  const skip = (page - 1) * limit;

  // Loai bo filter rong de query gon hon.
  Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

  const reports = await Report.find(filters)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('reporterId', 'fullName email avatar')
    .populate('reportedUserId', 'fullName email avatar')
    .populate('productId', 'title images');

  const total = await Report.countDocuments(filters);

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

function requireFeedback(reply, replyToReportedUser) {
  if (!String(reply || '').trim() && !String(replyToReportedUser || '').trim()) {
    throw new Error('Quyết định trả lời phản hồi cần ít nhất 1 nội dung phản hồi cho người báo cáo hoặc người bị báo cáo');
  }
}

function requireSanctionTarget(report, decision) {
  if (decision === 'remove_content' && report.reportType !== 'product') {
    throw new Error('Quyết định gỡ nội dung chỉ áp dụng cho báo cáo sản phẩm');
  }
  if (decision === 'remove_content' && !report.productId) {
    throw new Error('Không tìm thấy sản phẩm để thực hiện gỡ nội dung');
  }
  if (['warn_user', 'ban_user'].includes(decision) && !report.reportedUserId) {
    throw new Error('Không tìm thấy người dùng bị báo cáo để áp dụng quyết định');
  }
}

function validateModerationDecision(report, status, decision, reply, replyToReportedUser) {
  if (!RESOLUTION_STATUSES.includes(status)) {
    throw new Error('Trạng thái xử lý báo cáo không hợp lệ');
  }
  if (!MODERATION_DECISIONS.includes(decision)) {
    throw new Error('Quyết định xử lý báo cáo không hợp lệ');
  }
  if (status === 'dismissed' && decision !== 'reply_feedback') {
    throw new Error('Khi bỏ qua báo cáo chỉ được dùng quyết định trả lời phản hồi');
  }
  if (decision === 'reply_feedback') requireFeedback(reply, replyToReportedUser);
  if (status === 'resolved') requireSanctionTarget(report, decision);
}

// remove_content: the listing leaves the catalog.
async function removeReportedListing(report) {
  const product = await Product.findById(report.productId);
  if (product) {
    product.status = 'rejected';
    await product.save();
  }
}

// AC-MOD-03-1: every warning counts; a selling restriction starts at each configured threshold.
async function recordWarning(user) {
  const nextWarningCount = Number(user.violationCount || 0) + 1;
  const penalty = getReportWarningPenalty(nextWarningCount);
  user.violationCount = nextWarningCount;
  if (!penalty.shouldSuspendNow) {
    await user.save();
    return;
  }
  await applySellingRestrictionToUser(user, {
    durationMs: penalty.durationMs,
    reason: `Tài khoản bị hạn chế quyền bán do vi phạm từ báo cáo ở mốc ${nextWarningCount} cảnh báo (mức ${penalty.level}) trong ${penalty.label}.`,
    source: 'report_warning'
  });
}

// AC-MOD-03-2: the third resolved warning against one listing removes it. The report being
// resolved is not saved yet, so it is counted explicitly.
async function removeListingAfterRepeatedWarnings(report) {
  const earlierWarnings = await Report.countDocuments({
    _id: { $ne: report._id },
    productId: report.productId,
    status: 'resolved',
    moderatorDecision: 'warn_user'
  });
  if (earlierWarnings + 1 < PRODUCT_WARN_THRESHOLD) return;
  const product = await Product.findById(report.productId);
  if (product && !['rejected', 'hidden', 'deleted'].includes(product.status)) {
    product.status = 'rejected';
    await product.save();
  }
}

// INV-04: an admin is never warned into a restriction.
async function warnReportedUser(report) {
  const user = await User.findById(report.reportedUserId);
  if (user && user.role !== 'admin') await recordWarning(user);
  if (report.productId) await removeListingAfterRepeatedWarnings(report);
}

async function banReportedUser(report, notes) {
  const user = await User.findById(report.reportedUserId);
  if (!user) return;
  if (user.role === 'admin') {
    throw new Error('Không thể khóa tài khoản admin');
  }
  await applySellingRestrictionToUser(user, {
    reason: notes || 'Tài khoản bị hạn chế quyền bán trực tiếp theo quyết định ban_user của moderator.',
    source: 'report_ban'
  });
}

const SANCTIONS = { remove_content: removeReportedListing, warn_user: warnReportedUser, ban_user: banReportedUser };

async function notifyReportParties(report, reply, replyToReportedUser) {
  await pushReportNotification(
    report.reporterId,
    'Cập nhật báo cáo',
    reply || 'Báo cáo của bạn đã được moderator xử lý.',
    report._id
  );
  await pushReportNotification(
    report.reportedUserId,
    'Thông báo xử lý báo cáo',
    replyToReportedUser || 'Bạn có cập nhật mới liên quan đến một báo cáo vi phạm.',
    report._id
  );
}

/**
 * Xu ly bao cao (moderator/admin). Mot bao cao chi duoc xu ly mot lan.
 */
async function resolveReport(
  reportId,
  moderatorId,
  status,
  decision,
  notes,
  reply = '',
  replyToReportedUser = ''
) {
  const report = await Report.findById(reportId);
  if (!report) {
    throw new Error('Báo cáo không tồn tại');
  }
  if (RESOLUTION_STATUSES.includes(report.status)) {
    throw new Error('Báo cáo này đã được xử lý trước đó rồi');
  }
  validateModerationDecision(report, status, decision, reply, replyToReportedUser);

  report.status = status;
  report.moderatorDecision = decision;
  report.moderatorNotes = notes;
  report.moderatorReply = reply;
  report.moderatorReplyToReportedUser = replyToReportedUser;
  report.moderatorId = moderatorId;
  report.resolvedAt = new Date();

  if (status === 'resolved' && SANCTIONS[decision]) {
    await SANCTIONS[decision](report, notes);
  }
  await report.save();
  await notifyReportParties(report, reply, replyToReportedUser);

  return report;
}

/**
 * Lay tranh chap theo orderId, kem kiem tra quyen truy cap.
 */
async function getDisputeByOrderId(orderId, userId) {
  const dispute = await Dispute.findOne({ orderId })
    .populate('orderId', 'agreedAmount totalToPay status')
    .populate('buyerId', 'fullName email avatar phone')
    .populate('sellerId', 'fullName email avatar phone')
    .populate('productId', 'title price images description')
    .populate('moderatorId', 'fullName email');

  if (!dispute) {
    return null;
  }

  if (userId) {
    const user = await User.findById(userId);
    const isAuthorized =
      dispute.buyerId._id.toString() === userId.toString() ||
      dispute.sellerId._id.toString() === userId.toString() ||
      (user && (user.role === 'moderator' || user.role === 'admin'));
    if (!isAuthorized) {
      throw new Error('Bạn không có quyền xem khiếu nại này');
    }
  }

  return dispute;
}

/**
 * Seller xac nhan da nhan lai hang trong luong return_request.
 */
async function confirmSellerReturn(disputeId, sellerId) {
  const dispute = await Dispute.findById(disputeId);
  if (!dispute) throw new Error('Khiếu nại không tồn tại');
  if (dispute.sellerId.toString() !== sellerId.toString())
    throw new Error('Bạn không phải người bán của đơn hàng này');
  if (dispute.reason !== 'return_request')
    throw new Error('Chỉ áp dụng cho yêu cầu hoàn hàng');
  if (dispute.status !== 'investigating')
    throw new Error('Chỉ xác nhận khi tranh chấp đang trong giai đoạn điều tra');
  if (dispute.sellerConfirmedReturnAt)
    throw new Error('Đã xác nhận nhận lại hàng trước đó');

  dispute.sellerConfirmedReturnAt = new Date();
  await dispute.save();
  return dispute;
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
  getUserReports,
  getUserDisputes,
  getAllReports,
  resolveReport
};
