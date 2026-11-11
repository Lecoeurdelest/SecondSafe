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
  let products = [];
  try {
    products = await Product.find({
      status: 'active',
      seller: { $in: sellerIds },
      $text: { $search: question }
    })
      .select(fields)
      .populate('category', 'name')
      .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
      .limit(5)
      .lean();
  } catch {
    products = [];
  }

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

async function generateWithFallback(prompt, fallback) {
  try {
    return await gemini.generateText(prompt);
  } catch {
    return fallback;
  }
}

function faqFallback(topic) {
  const answers = {
    account_access: 'Bạn có thể đăng nhập bằng email và mật khẩu. Nếu quên mật khẩu, hãy dùng chức năng khôi phục mật khẩu và làm theo hướng dẫn.',
    registration: 'Hãy đăng ký tài khoản bằng email, xác minh theo hướng dẫn rồi đăng nhập để sử dụng các chức năng của SecondSafe.',
    listing_products: 'Để đăng bán, vào khu vực đăng sản phẩm, điền thông tin, giá, tình trạng, hình ảnh và vị trí rồi gửi lên hệ thống.',
    purchasing_orders: 'Bạn có thể chọn sản phẩm, gửi yêu cầu mua hoặc đặt hàng theo quy trình hiển thị trong hệ thống. Tiến trình đơn hàng được cập nhật trong mục đơn hàng.',
    payments_wallet: 'SecondSafe hỗ trợ ví và quy trình thanh toán trong nền tảng. Không chuyển tiền cho người bán bên ngoài hệ thống và không chia sẻ thông tin thanh toán cá nhân.',
    messaging_support: 'Bạn có thể nhắn cho người bán trong cuộc trò chuyện của sản phẩm hoặc mở mục Hỗ trợ để liên hệ nhân viên.',
    general: 'Bạn có thể xem hướng dẫn trực tiếp trong từng mục trên SecondSafe hoặc mở mục Hỗ trợ để nhân viên tư vấn thêm.'
  };
  return answers[topic] || answers.general;
}

function productFallback(products) {
  if (!products.length) return 'Hiện chưa có sản phẩm phù hợp để gợi ý. Bạn có thể thử mô tả một danh mục hoặc nhu cầu khác.';
  const choices = products.slice(0, 3).map((product, index) => `${index + 1}. ${product.category || 'Sản phẩm'} — tình trạng ${product.condition || 'chưa cập nhật'}, giá khoảng ${Number(product.priceVnd || 0).toLocaleString('vi-VN')} VNĐ`).join('; ');
  return `Bạn có thể xem các lựa chọn phù hợp hiện có: ${choices}. Hãy kiểm tra mô tả và điều kiện sản phẩm trước khi đặt mua.`;
}

async function ask({ message, mode }) {
  const question = normalizeQuestion(message);
  if (!['faq', 'products'].includes(mode)) throw httpError(400, 'Chế độ trợ lý không hợp lệ.');

  if (mode === 'faq') {
    const topic = faqTopic(question);
    const answer = await generateWithFallback([
      'Bạn là trợ lý hỗ trợ khách hàng của SecondSafe, sàn mua bán đồ đã qua sử dụng.',
      'Trả lời bằng tiếng Việt, ngắn gọn, rõ ràng. Chỉ nêu quy trình chung đã được mô tả dưới đây.',
      'Không khẳng định chính sách, mức phí, thời hạn hoàn tiền hoặc trạng thái tài khoản nếu không có trong dữ liệu.',
      'SecondSafe có tài khoản người dùng, danh sách sản phẩm, chat người mua/người bán, yêu cầu mua, đơn hàng, ví và quy trình giữ tiền trong giao dịch.',
      'Không yêu cầu hoặc lặp lại mật khẩu, OTP, thông tin ngân hàng, địa chỉ hay dữ liệu cá nhân.',
      'Nếu không chắc, hướng dẫn khách mở mục Hỗ trợ để liên hệ nhân viên.',
      `Chủ đề câu hỏi: ${topic}.`
    ].join('\n'), faqFallback(topic));
    return { mode, answer, products: [] };
  }

  const products = await publicProductCandidates(question);
  const answer = products.length
    ? await generateWithFallback([
      'Bạn là trợ lý tư vấn mua sắm SecondSafe. Trả lời tiếng Việt, không bịa thuộc tính sản phẩm.',
      'Chỉ dựa trên các thuộc tính không định danh trong danh sách sau. Không suy đoán danh tính, vị trí hoặc thông tin người bán.',
      'Không yêu cầu dữ liệu cá nhân hoặc thanh toán ngoài nền tảng.',
      `Các lựa chọn sản phẩm: ${JSON.stringify(products.map(({ priceVnd, condition, category }) => ({ priceVnd, condition, category }))) }`
    ].join('\n'), productFallback(products))
    : productFallback(products);
  return { mode, answer, products };
}

async function getModerationGuidance(reportId) {
  if (!mongoose.Types.ObjectId.isValid(String(reportId || ''))) throw httpError(400, 'Mã báo cáo không hợp lệ.');
  const report = await Report.findById(reportId).select('reportType reason status').lean();
  if (!report) throw httpError(404, 'Không tìm thấy báo cáo.');
  if (!MODERATION_TYPES.has(report.reportType) || !MODERATION_REASONS.has(report.reason)) {
    throw httpError(422, 'Thông tin phân loại báo cáo chưa được hỗ trợ.');
  }

  const guidance = await generateWithFallback([
    'Bạn hỗ trợ nhân viên kiểm duyệt SecondSafe. Không quyết định kết quả và không đưa ra kết luận về người dùng.',
    'Trả lời tiếng Việt với checklist trung lập: cần xác minh gì, bằng chứng nào cần xem trong hệ thống nội bộ, bước xử lý an toàn tiếp theo.',
    'Dữ liệu duy nhất được cung cấp là các mã phân loại chung; không suy đoán nội dung báo cáo.',
    `Loại đối tượng: ${report.reportType}. Lý do: ${report.reason}. Trạng thái: ${report.status}.`
  ].join('\n'), 'Checklist tham khảo: 1) Xem lại loại đối tượng, lý do và trạng thái báo cáo trong hồ sơ nội bộ. 2) Đối chiếu mô tả, bằng chứng liên quan và lịch sử xử lý phù hợp. 3) Ghi rõ căn cứ và rủi ro trước khi đề xuất bước xử lý. 4) Nhân viên phải tự xem xét và đưa ra quyết định cuối cùng.');
  return { guidance, humanDecisionRequired: true };
}

module.exports = { ask, getModerationGuidance, normalizeQuestion, redactSensitiveText };
