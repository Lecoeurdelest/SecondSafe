const mongoose = require('mongoose');
const Product = require('../products/product.model');
const Report = require('../reports/report.model');
const { getEligibleSellerIds } = require('../products/product-availability.service');
const gemini = require('./gemini.service');

const MAX_QUESTION_LENGTH = 600;
const MODERATION_REASONS = new Set(['counterfeit', 'inappropriate', 'scam', 'spam', 'other']);
const MODERATION_TYPES = new Set(['product', 'user']);
const FAQ_TOPICS = [
  { pattern: /đăng nhập|tài khoản|mat khau|mật khẩu|password/i, topic: 'account_access' },
  { pattern: /đăng ký|xac thuc|xác thực|verification/i, topic: 'registration' },
  { pattern: /đăng bán|đăng sản phẩm|listing|sản phẩm/i, topic: 'listing_products' },
  { pattern: /mua hàng|mua sản phẩm|đặt hàng|đơn hàng|order/i, topic: 'purchasing_orders' },
  { pattern: /thanh toán|ví|hoàn tiền|payment|refund/i, topic: 'payments_wallet' },
  { pattern: /chat|nhắn tin|hỗ trợ|support/i, topic: 'messaging_support' }
];

function httpError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode });
}

function redactSensitiveText(value) {
  return String(value || '')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[đã ẩn email]')
    .replace(/\b(?:\+?84|0)(?:[\s().-]*\d){8,10}\b/g, '[đã ẩn số điện thoại]')
    .replace(/\b\d{9,19}\b/g, '[đã ẩn dãy số]')
    .replace(/\b(?:mật khẩu|password|otp|api[_\s-]?key|token)\s*[:=]\s*\S+/gi, '[đã ẩn thông tin]')
    .replace(/https?:\/\/\S+/gi, '[đã ẩn liên kết]')
    .trim();
}

function normalizeQuestion(value) {
  if (typeof value !== 'string') throw httpError(400, 'Vui lòng nhập câu hỏi.');
  if (value.trim().length > MAX_QUESTION_LENGTH) throw httpError(400, 'Câu hỏi không được vượt quá 600 ký tự.');
  const question = redactSensitiveText(value);
  if (!question) throw httpError(400, 'Câu hỏi không được để trống sau khi lọc thông tin nhạy cảm.');
  if (question.length > MAX_QUESTION_LENGTH) throw httpError(400, 'Câu hỏi không được vượt quá 600 ký tự.');
  return question;
}

function faqTopic(question) {
  return FAQ_TOPICS.find(item => item.pattern.test(question))?.topic || 'general';
}

async function publicProductCandidates(question) {
  const sellerIds = await getEligibleSellerIds();
  if (!sellerIds.length) return [];
  const fields = 'title description price condition images location category';
  let products = await Product.find({
    status: 'active',
    seller: { $in: sellerIds },
    $text: { $search: question }
  })
    .select(fields)
    .populate('category', 'name')
    .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
    .limit(5)
    .lean();

  if (!products.length) {
    products = await Product.find({ status: 'active', seller: { $in: sellerIds } })
      .select(fields)
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
  }
  return products.map(product => ({
    id: String(product._id),
    title: product.title,
    priceVnd: product.price,
    condition: product.condition,
    category: product.category?.name || 'Chưa phân loại',
    location: [product.location?.district, product.location?.city].filter(Boolean).join(', '),
    description: String(product.description || '').slice(0, 350),
    image: product.images?.[0] || null
  }));
}

async function ask({ message, mode }) {
  const question = normalizeQuestion(message);
  if (!['faq', 'products'].includes(mode)) throw httpError(400, 'Chế độ trợ lý không hợp lệ.');

  if (mode === 'faq') {
    const answer = await gemini.generateText([
      'Bạn là trợ lý hỗ trợ khách hàng của SecondSafe, sàn mua bán đồ đã qua sử dụng.',
      'Trả lời bằng tiếng Việt, ngắn gọn, rõ ràng. Chỉ nêu quy trình chung đã được mô tả dưới đây.',
      'Không khẳng định chính sách, mức phí, thời hạn hoàn tiền hoặc trạng thái tài khoản nếu không có trong dữ liệu.',
      'SecondSafe có tài khoản người dùng, danh sách sản phẩm, chat người mua/người bán, yêu cầu mua, đơn hàng, ví và quy trình giữ tiền trong giao dịch.',
      'Không yêu cầu hoặc lặp lại mật khẩu, OTP, thông tin ngân hàng, địa chỉ hay dữ liệu cá nhân.',
      'Nếu không chắc, hướng dẫn khách mở mục Hỗ trợ để liên hệ nhân viên.',
      `Chủ đề câu hỏi: ${faqTopic(question)}.`
    ].join('\n'));
    return { mode, answer, products: [] };
  }

  const products = await publicProductCandidates(question);
  const answer = products.length
    ? await gemini.generateText([
      'Bạn là trợ lý tư vấn mua sắm SecondSafe. Trả lời tiếng Việt, không bịa thuộc tính sản phẩm.',
      'Chỉ dựa trên các thuộc tính không định danh trong danh sách sau. Không suy đoán danh tính, vị trí hoặc thông tin người bán.',
      'Không yêu cầu dữ liệu cá nhân hoặc thanh toán ngoài nền tảng.',
      `Các lựa chọn sản phẩm: ${JSON.stringify(products.map(({ priceVnd, condition, category }) => ({ priceVnd, condition, category }))) }`
    ].join('\n'))
    : 'Hiện chưa có sản phẩm phù hợp để gợi ý. Bạn có thể thử mô tả một danh mục hoặc nhu cầu khác.';
  return { mode, answer, products };
}

async function getModerationGuidance(reportId) {
  if (!mongoose.Types.ObjectId.isValid(String(reportId || ''))) throw httpError(400, 'Mã báo cáo không hợp lệ.');
  const report = await Report.findById(reportId).select('reportType reason status').lean();
  if (!report) throw httpError(404, 'Không tìm thấy báo cáo.');
  if (!MODERATION_TYPES.has(report.reportType) || !MODERATION_REASONS.has(report.reason)) {
    throw httpError(422, 'Thông tin phân loại báo cáo chưa được hỗ trợ.');
  }

  const guidance = await gemini.generateText([
    'Bạn hỗ trợ nhân viên kiểm duyệt SecondSafe. Không quyết định kết quả và không đưa ra kết luận về người dùng.',
    'Trả lời tiếng Việt với checklist trung lập: cần xác minh gì, bằng chứng nào cần xem trong hệ thống nội bộ, bước xử lý an toàn tiếp theo.',
    'Dữ liệu duy nhất được cung cấp là các mã phân loại chung; không suy đoán nội dung báo cáo.',
    `Loại đối tượng: ${report.reportType}. Lý do: ${report.reason}. Trạng thái: ${report.status}.`
  ].join('\n'));
  return { guidance, humanDecisionRequired: true };
}

module.exports = { ask, getModerationGuidance, normalizeQuestion, redactSensitiveText };
