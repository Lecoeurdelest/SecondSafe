// Extra fixtures for the second QA pass; falls back to the first pass fixtures in qa-lib.js.
const L = require('./qa-lib.js');
const { iso, DAY, IMG, me, s1, people, hex, orderListing, buyerOrder, sellerOrders, P } = L;

// ---------- buyer order lists ----------
const listing = (id, title, cat, extra = {}) => ({ _id: id, title, images: [IMG(cat)], category: cat, condition: 'like_new', ...extra });
const bo = (id, code, status, lst, price, mins, extra = {}) => ({
  _id: id, orderCode: code, status, agreedPrice: price, totalAmount: Math.round(price * 1.05), platformFee: Math.round(price * 0.05),
  createdAt: iso(mins), listing: lst, seller: s1, buyer: me, ...extra,
});
const lIphone = listing('p1', 'iPhone 13 Pro 128GB còn bảo hành 8 tháng', 'electronics');
const lNike = listing('p2', 'Giày Nike Air Force 1 size 42 chính hãng', 'fashion');
const lBooks = listing('p3', 'Bộ sách Harry Potter tiếng Việt trọn bộ', 'books');
const lDesk = listing('p4', 'Bàn học gỗ sồi 1m2 kèm ghế', 'home');
const lRacket = listing('p5', 'Vợt cầu lông Yonex Astrox 88D', 'sports');
const lCam = listing('p6', 'Máy ảnh Fujifilm X-T30 body', 'electronics');
const lSpeaker = listing('p7', 'Loa Marshall Emberton II', 'electronics');
const buyingOrders = [
  bo('ob1', 'SS-10031', 'awaiting_payment', lIphone, 12500000, 120),
  bo('ob2', 'SS-10030', 'paid', lNike, 890000, 600, { paidAt: iso(500) }),
  bo('ob3', 'SS-10029', 'paid', lDesk, 1450000, 1200, { paidAt: iso(1100) }),
  bo('ob4', 'SS-10028', 'shipped', lRacket, 2100000, 2 * DAY, { shippedAt: iso(1 * DAY) }),
  bo('ob5', 'SS-10027', 'shipped', lCam, 15800000, 3 * DAY, { shippedAt: iso(2 * DAY) }),
  bo('ob6', 'SS-10026', 'delivered', lBooks, 650000, 4 * DAY, { shippedAt: iso(3 * DAY) }),
  bo('ob7', 'SS-10025', 'completed', lSpeaker, 3200000, 9 * DAY, { shippedAt: iso(8 * DAY) }),
  bo('ob8', 'SS-10024', 'cancelled', lIphone, 12500000, 12 * DAY),
  bo('ob9', 'SS-10023', 'disputed', lCam, 15800000, 15 * DAY, { shippedAt: iso(13 * DAY) }),
];
const sellingExtra = [
  { _id: 'so1b', status: 'awaiting_seller_confirmation', agreedPrice: 780000, createdAt: iso(60), productId: P('p8', 'Tai nghe Sony WH-1000XM4 chính hãng', 3500000, 'electronics', 'active'), buyerId: people[1] },
  { _id: 'so2b', status: 'paid', agreedPrice: 1450000, createdAt: iso(900), productId: P('p9', 'Bàn học gỗ sồi 1m2 kèm ghế', 1450000, 'home', 'active'), buyerId: people[3] },
  { _id: 'so3b', status: 'shipped', agreedPrice: 890000, createdAt: iso(3 * DAY), productId: P('p10', 'Giày Nike Air Force 1 size 42', 890000, 'fashion', 'active'), buyerId: people[5] },
];
// One shape that satisfies both SellerOrders (productId/buyerId) and Orders (listing/buyer).
const sellingOrders = [...sellerOrders, ...sellingExtra].map((o, i) => ({
  ...o, orderCode: 'SS-' + (10050 - i), listing: listing(o.productId._id, o.productId.title, o.productId.category || 'electronics'),
  buyer: o.buyerId, seller: me, totalAmount: Math.round(o.agreedPrice * 1.05), shippedAt: ['shipped', 'delivered', 'completed'].includes(o.status) ? o.createdAt : undefined,
}));

// ---------- buyer order detail (extra states) ----------
const shipping = { provider: 'ghn', trackingNumber: 'GHN8827364510', estimatedDelivery: iso(-2 * DAY), notes: 'Giao giờ hành chính, gọi trước khi đến.' };
const buyer1 = { _id: 'b1', fullName: 'Lê Thị Hoa' };
const disputeConv = [
  { senderRole: 'buyer', content: 'Máy nhận được bị trầy xước nhiều ở viền và mặt lưng, không đúng như mô tả "như mới". Pin chỉ còn 84%, thấp hơn nhiều so với 92% người bán cam kết.', evidenceFiles: [IMG('electronics'), IMG('fashion')], createdAt: iso(5 * DAY) },
  { senderRole: 'system', content: 'Khiếu nại đã được tạo và chuyển cho quản trị viên.', evidenceFiles: [], createdAt: iso(5 * DAY - 1) },
  { senderRole: 'moderator', content: 'Chúng tôi đã tiếp nhận khiếu nại. Vui lòng cả hai bên bổ sung bằng chứng (ảnh chụp màn hình pin, video mở hộp) trong vòng 48 giờ.', evidenceFiles: [], createdAt: iso(4 * DAY) },
  { senderRole: 'seller', content: 'Máy được kiểm tra kỹ trước khi gửi, ảnh đính kèm là tình trạng lúc gói hàng. Có thể trầy do vận chuyển.', evidenceFiles: [IMG('home')], createdAt: iso(3 * DAY) },
];
const orderDisputes = {
  o4: { _id: hex(22), reason: 'not_as_described', status: 'investigating', description: 'Máy bị trầy xước nhiều hơn mô tả.', createdAt: iso(5 * DAY), investigatingAt: iso(4 * DAY), updatedAt: iso(3 * DAY), sellerResponse: 'Có thể trầy do vận chuyển', sellerEvidenceImages: [IMG('home')], moderatorNotes: 'Đang đối chiếu bằng chứng của hai bên.', disputeConversation: disputeConv },
  o6: { _id: hex(24), reason: 'return_request', status: 'investigating', description: 'Tôi muốn hoàn trả máy do không đúng nhu cầu.', createdAt: iso(4 * DAY), investigatingAt: iso(3 * DAY), disputeConversation: [{ senderRole: 'buyer', content: 'Tôi muốn hoàn trả máy do không đúng nhu cầu sử dụng.', evidenceFiles: [], createdAt: iso(4 * DAY) }, { senderRole: 'moderator', content: 'Vui lòng gửi trả hàng cho người bán và chờ xác nhận.', evidenceFiles: [], createdAt: iso(3 * DAY) }] },
};
const orderById2 = {
  o4: buyerOrder('o4', 'disputed', { orderCode: 'SS-10023', paidAt: iso(8 * DAY), shippedAt: iso(6 * DAY), deliveredAt: iso(5 * DAY), shipping }),
  o5: buyerOrder('o5', 'cancelled', { orderCode: 'SS-10018', cancelledAt: iso(2 * DAY), cancellationReason: 'Hủy bởi Moderator. Lý do: Người bán xác nhận không còn hàng trong kho.' }),
  o6: buyerOrder('o6', 'disputed', { orderCode: 'SS-10022', buyer: buyer1, seller: me, paidAt: iso(8 * DAY), shippedAt: iso(6 * DAY), deliveredAt: iso(5 * DAY), shipping }),
  o7: buyerOrder('o7', 'delivered', { orderCode: 'SS-10026', paidAt: iso(5 * DAY), shippedAt: iso(3 * DAY), deliveredAt: iso(1 * DAY), shipping }),
};

// ---------- staff detail fixtures ----------
const person = (id, name, phone, address) => ({ _id: id, fullName: name, phone, address });
const buyerP = person('b1', 'Lê Thị Hoa', '0912345678', '12 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh');
const sellerP = person('s1', 'Nguyễn Văn An', '0987654321', '45 Lê Lợi, Phường 4, Quận Gò Vấp, TP. Hồ Chí Minh');
const modOrder = (id, code, status, extra = {}) => ({
  _id: id, orderCode: code, status, paymentStatus: 'paid', trackingNumber: 'GHN8827364510', buyerId: buyerP, sellerId: sellerP,
  productId: { _id: 'p1', title: 'iPhone 13 Pro 128GB còn bảo hành 8 tháng' }, totalToPay: 12650000,
  shippingRecipientName: 'Lê Thị Hoa', shippingPhone: '0912345678', shippingAddress: '12 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
  shippingProvider: 'GHN', estimatedDelivery: iso(-2 * DAY), createdAt: iso(3 * DAY), shippedAt: iso(1 * DAY), allowedNextStatuses: [], ...extra,
});
const modOrderDetail = {
  [hex(11)]: modOrder(hex(11), 'SS-10024', 'shipped', { allowedNextStatuses: ['completed', 'disputed', 'cancelled'] }),
  [hex(12)]: modOrder(hex(12), 'SS-10023', 'awaiting_payment', { paymentStatus: 'unpaid', trackingNumber: null, shippedAt: null, allowedNextStatuses: ['paid', 'cancelled'] }),
  [hex(16)]: modOrder(hex(16), 'SS-10019', 'disputed', { allowedNextStatuses: ['completed', 'cancelled'] }),
  [hex(17)]: modOrder(hex(17), 'SS-10018', 'cancelled', { paymentStatus: 'refunded' }),
  [hex(15)]: modOrder(hex(15), 'SS-10020', 'completed'),
};
const evid = [IMG('electronics'), IMG('fashion'), IMG('home'), IMG('sports')];
const reportDetail = {
  [hex(1)]: { _id: hex(1), reportType: 'user', reporterId: people[0], reportedUserId: people[1], reason: 'Lừa đảo, không giao hàng', description: 'Người này nhận tiền cọc 3 triệu qua chuyển khoản nhưng sau đó chặn liên lạc và không gửi hàng. Tôi đã gửi ảnh chụp màn hình giao dịch và đoạn chat làm bằng chứng.', status: 'pending', evidenceImages: evid, reportedUserStats: { warningCount: 2, totalReports: 4, isSuspended: false }, createdAt: iso(2 * DAY) },
  [hex(2)]: { _id: hex(2), reportType: 'product', reporterId: people[2], productId: { _id: 'p77', title: 'Đồng hồ Rolex Submariner giá rẻ' }, reason: 'Hàng giả, hàng nhái', description: 'Giá quá thấp so với thị trường, ảnh lấy từ trang khác, người bán không cho kiểm tra hàng trực tiếp.', status: 'reviewing', evidenceImages: evid.slice(0, 2), productStats: { warningActions: 3, totalReports: 7, isRemoved: true }, createdAt: iso(3 * DAY) },
  [hex(3)]: { _id: hex(3), reportType: 'user', reporterId: people[3], reportedUserId: people[4], reason: 'Ngôn từ xúc phạm trong chat', description: 'Dùng từ ngữ thô tục khi thương lượng giá.', status: 'resolved', evidenceImages: [], moderatorDecision: 'warn_user', moderatorReply: 'Cảm ơn bạn đã báo cáo, chúng tôi đã cảnh báo người dùng này.', moderatorReplyToReportedUser: 'Vui lòng giữ thái độ lịch sự khi giao dịch.', reportedUserStats: { warningCount: 0, totalReports: 1 }, createdAt: iso(6 * DAY) },
  [hex(5)]: { _id: hex(5), reportType: 'user', reporterId: people[1], reportedUserId: people[2], reason: 'Spam tin nhắn quảng cáo', description: 'Gửi tin nhắn quảng cáo cho nhiều người dùng.', status: 'pending', evidenceImages: [], reportedUserStats: { warningCount: 5, totalReports: 8, isSuspended: true }, createdAt: iso(1 * DAY) },
};
const dsp = (id, status, reason, extra = {}) => ({
  _id: id, buyerId: people[0], sellerId: s1, productId: { title: 'iPhone 13 Pro 128GB còn bảo hành 8 tháng' }, orderId: { agreedAmount: 12500000 },
  reason, status, description: 'Máy bị trầy xước nhiều hơn mô tả.', createdAt: iso(5 * DAY), ...extra,
});
const disputeDetail = {
  [hex(21)]: dsp(hex(21), 'pending', 'not_as_described', { disputeConversation: [disputeConv[0]] }),
  [hex(22)]: dsp(hex(22), 'investigating', 'not_as_described', { moderatorNotes: '', disputeConversation: disputeConv }),
  [hex(23)]: dsp(hex(23), 'resolved', 'not_received', { resolution: 'refund', resolvedAt: iso(1 * DAY), disputeConversation: disputeConv.slice(0, 3) }),
  [hex(24)]: dsp(hex(24), 'investigating', 'return_request', { disputeConversation: orderDisputes.o6.disputeConversation }),
};

// ---------- notifications ----------
const N = (id, type, title, message, mins, isRead) => ({ _id: id, type, title, message, createdAt: iso(mins), isRead });
const notifications = [
  N('n1', 'order_shipped', 'Đơn hàng đang được giao', 'Đơn hàng SS-10028 đã được bàn giao cho đơn vị vận chuyển GHN. Mã vận đơn GHN8827364510.', 4, false),
  N('n2', 'payment_success', 'Thanh toán thành công', 'Bạn đã thanh toán 12.650.000 ₫ cho đơn hàng SS-10024.', 35, false),
  N('n3', 'dispute_update', 'Cập nhật khiếu nại', 'Quản trị viên đã yêu cầu bạn bổ sung bằng chứng cho khiếu nại của đơn hàng SS-10023 trong vòng 48 giờ, nếu không khiếu nại có thể bị đóng lại theo chính sách của nền tảng.', 120, false),
  N('n4', 'order_created', 'Có đơn mua mới cho "iPhone 13 Pro 128GB còn bảo hành 8 tháng, đầy đủ hộp và phụ kiện chính hãng, pin 92%"', 'Người mua Lê Thị Hoa vừa gửi yêu cầu mua sản phẩm của bạn.', 300, false),
  N('n5', 'review_received', 'Bạn nhận được đánh giá 5 sao', 'Phạm Quốc Bảo: "Máy đúng mô tả, giao nhanh, người bán nhiệt tình. Sẽ ủng hộ tiếp những lần sau nhé shop ơi!"', 600, false),
  N('n6', 'system', 'Bảo trì hệ thống', 'Hệ thống sẽ bảo trì từ 02:00 đến 03:00 ngày mai.', 1500, true),
  N('n7', 'security', 'Đăng nhập từ thiết bị mới', 'Tài khoản của bạn vừa được đăng nhập từ Chrome trên Windows tại TP. Hồ Chí Minh. Nếu không phải bạn, hãy đổi mật khẩu ngay.', 2000, true),
  N('n8', 'order_completed', 'Đơn hàng hoàn tất', 'Đơn hàng SS-10020 đã hoàn tất, tiền đã được chuyển vào ví của bạn.', 3000, true),
  N('n9', 'report_update', 'Báo cáo đã được xử lý', 'Báo cáo của bạn về tin đăng "Đồng hồ Rolex Submariner giá rẻ" đã được xử lý.', 4000, true),
  N('n10', 'order_confirmed', 'Người bán đã xác nhận đơn', '', 5000, true),
  N('n11', 'dispute_created', 'Có khiếu nại mới', 'Người mua Võ Thanh Tùng đã tạo khiếu nại cho đơn SS-10022: https://secondsafe.vn/orders/a1b2c3d4e5f6a1b2c3d4e5f6/dispute/very-long-unbroken-link-segment-1234567890abcdefghijklmnopqrstuvwxyz', 6000, true),
  N('n12', 'unknown_type', 'Thông báo khác', 'Loại thông báo không xác định dùng biểu tượng mặc định.', 7000, true),
];

function body2(role, urlStr, opts = {}) {
  const u = new URL(urlStr);
  const p = u.pathname.replace(/^\/api/, '');
  let m;
  const status = u.searchParams.get('status');
  if (opts.notif) {
    if (p === '/notifications/unread-count') return { unreadCount: notifications.filter((n) => !n.isRead).length };
    if (p === '/notifications') return { notifications, pagination: { page: 1, totalPages: 2, total: 20 } };
  }
  if (p === '/orders/buying') { const a = status ? buyingOrders.filter((o) => o.status === status) : buyingOrders; return { orders: a, currentPage: 1, totalPages: 1, totalOrders: a.length }; }
  if (p === '/orders/selling') { const a = status ? sellingOrders.filter((o) => o.status === status) : sellingOrders; return { orders: a, currentPage: 1, totalPages: 1, totalOrders: a.length }; }
  if ((m = p.match(/^\/orders\/(o\d)$/)) && orderById2[m[1]]) return orderById2[m[1]];
  if ((m = p.match(/^\/orders\/(o\d)\/dispute$/)) && orderDisputes[m[1]]) return orderDisputes[m[1]];
  if ((m = p.match(/^\/moderator\/orders\/([0-9a-f]{24})$/))) return modOrderDetail[m[1]] || modOrderDetail[hex(11)];
  if ((m = p.match(/^\/moderator\/reports\/([0-9a-f]{24})$/))) return reportDetail[m[1]] || reportDetail[hex(1)];
  if ((m = p.match(/^\/moderator\/disputes\/([0-9a-f]{24})$/))) return disputeDetail[m[1]] || disputeDetail[hex(22)];
  if (p === '/users/profile') return { _id: 'm1', fullName: 'Nguyễn Thu Hà', email: 'mod@secondsafe.vn', phone: '0938123456', address: '25 Điện Biên Phủ, Quận Bình Thạnh, TP. Hồ Chí Minh', role: role === 'admin' ? 'admin' : 'moderator' };
  return L.body(role, urlStr);
}

module.exports = { body2, notifications, hex };
