const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const BUILD = '/home/user/secondsafe/frontend/build';
const OUT = '/tmp/claude-0/-home-user/3810a9f3-7ee0-5009-89b0-bdb596a1b147/scratchpad/qa2';
const PORT = 4283;
const ONLY = process.argv[2] ? new RegExp(process.argv[2]) : null;

const server = http.createServer((req, res) => {
  let file = path.join(BUILD, req.url.split('?')[0]);
  if (!file.startsWith(BUILD) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(BUILD, 'index.html');
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json' };
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

const iso = (m) => new Date(Date.now() - m * 60000).toISOString();
const DAY = 1440;
const IMG = (c) => `/images/products/${c}.jpg`;

// ---------- people ----------
const me = { _id: 'u1', id: 'u1', fullName: 'Trần Minh Anh', email: 'minhanh@example.com', phone: '0901234567', createdAt: iso(400 * DAY) };
const s1 = { _id: 's1', fullName: 'Nguyễn Văn An', email: 'an.nguyen@example.com', createdAt: iso(300 * DAY) };
const people = [
  { _id: 'b1', fullName: 'Lê Thị Hoa' }, { _id: 'b2', fullName: 'Phạm Quốc Bảo' }, { _id: 'b3', fullName: 'Võ Thanh Tùng' },
  { _id: 'b4', fullName: 'Đặng Mỹ Linh' }, { _id: 'b5', fullName: 'Hoàng Gia Huy' }, { _id: 'b6', fullName: 'Bùi Ngọc Mai' },
];

// ---------- products ----------
const loc = { district: 'Quận 3', city: 'TP. Hồ Chí Minh' };
const P = (id, title, price, category, status, extra = {}) => ({ _id: id, title, price, category, status, images: [IMG(category)], location: loc, condition: 'like_new', ...extra });
const myProducts = [
  P('p1', 'iPhone 13 Pro 128GB còn bảo hành 8 tháng', 12500000, 'electronics', 'active'),
  P('p2', 'Giày Nike Air Force 1 size 42 chính hãng', 890000, 'fashion', 'active'),
  P('p3', 'Bộ sách Harry Potter tiếng Việt trọn bộ', 650000, 'books', 'sold'),
  P('p4', 'Bàn học gỗ sồi 1m2 kèm ghế', 1450000, 'home', 'hidden'),
  P('p5', 'Vợt cầu lông Yonex Astrox 88D', 2100000, 'sports', 'pending', { isInActiveOrder: true }),
  P('p6', 'Máy ảnh Fujifilm X-T30 body', 15800000, 'electronics', 'deleted'),
];

// ---------- buyer / seller orders ----------
const sellerOrders = [
  { _id: 'so1', status: 'awaiting_payment', agreedPrice: 12500000, createdAt: iso(120), productId: myProducts[0], buyerId: people[0] },
  { _id: 'so2', status: 'paid', agreedPrice: 890000, createdAt: iso(600), productId: myProducts[1], buyerId: people[1] },
  { _id: 'so3', status: 'shipped', agreedPrice: 2100000, createdAt: iso(2 * DAY), productId: myProducts[4], buyerId: people[2] },
  { _id: 'so4', status: 'delivered', agreedPrice: 1450000, createdAt: iso(4 * DAY), productId: myProducts[3], buyerId: people[3] },
  { _id: 'so5', status: 'completed', agreedPrice: 650000, createdAt: iso(9 * DAY), productId: myProducts[2], buyerId: people[4] },
  { _id: 'so6', status: 'cancelled', agreedPrice: 15800000, createdAt: iso(12 * DAY), productId: myProducts[5], buyerId: people[5] },
  { _id: 'so7', status: 'disputed', agreedPrice: 3200000, createdAt: iso(15 * DAY), productId: P('p7', 'Loa Marshall Emberton II', 3200000, 'electronics', 'sold'), buyerId: people[0] },
];
const orderListing = { _id: 'p1', title: 'iPhone 13 Pro 128GB còn bảo hành 8 tháng', description: 'Máy dùng kỹ, pin 92%, đầy đủ hộp và phụ kiện chính hãng. Không trầy xước, đã dán cường lực từ đầu.', condition: 'like_new', category: 'electronics', images: [IMG('electronics')], location: loc };
const buyerOrder = (id, status, extra = {}) => ({
  _id: id, orderCode: 'SS-10024', status, agreedPrice: 12500000, totalAmount: 12650000, platformFee: 625000,
  createdAt: iso(3 * DAY), listing: orderListing, seller: s1, buyer: me, ...extra,
});
const orderById = {
  o1: buyerOrder('o1', 'shipped', {
    paidAt: iso(3 * DAY - 60), shippedAt: iso(1 * DAY),
    shipping: { provider: 'ghn', trackingNumber: 'GHN8827364510', estimatedDelivery: iso(-2 * DAY), notes: 'Giao giờ hành chính, gọi trước khi đến.' },
  }),
  o2: buyerOrder('o2', 'pending', { orderCode: 'SS-10031' }),
  o3: buyerOrder('o3', 'completed', { paidAt: iso(8 * DAY), shippedAt: iso(6 * DAY), deliveredAt: iso(5 * DAY), completedAt: iso(4 * DAY), shipping: { provider: 'ghtk', trackingNumber: 'GHTK5521', notes: '' } }),
};

// ---------- wallet ----------
const bank = { bankName: 'Vietcombank', bankAccount: '0071000888999', accountHolder: 'TRAN MINH ANH' };
const txs = [
  { _id: 't1', type: 'deposit', status: 'completed', amount: 2000000, description: 'Nạp tiền vào ví qua SePay', metadata: {}, createdAt: iso(200) },
  { _id: 't2', type: 'payment', status: 'completed', amount: 890000, description: 'Thanh toán đơn SS-10019', metadata: {}, createdAt: iso(1 * DAY) },
  { _id: 't3', type: 'withdrawal', status: 'pending', amount: 500000, description: 'Yêu cầu rút tiền', metadata: bank, createdAt: iso(2 * DAY) },
  { _id: 't4', type: 'earning', status: 'completed', amount: 1237500, description: 'Thu nhập đơn SS-10011', metadata: {}, createdAt: iso(3 * DAY) },
  { _id: 't5', type: 'withdrawal', status: 'completed', amount: 1000000, description: 'Rút tiền', metadata: bank, createdAt: iso(5 * DAY) },
  { _id: 't6', type: 'refund', status: 'completed', amount: 450000, description: 'Hoàn tiền đơn hủy', metadata: {}, createdAt: iso(6 * DAY) },
  { _id: 't7', type: 'fee', status: 'completed', amount: 62500, description: 'Phí nền tảng', metadata: {}, createdAt: iso(7 * DAY) },
  { _id: 't8', type: 'withdrawal', status: 'failed', amount: 300000, description: 'Rút tiền', metadata: bank, failureReason: 'Sai số tài khoản ngân hàng', createdAt: iso(8 * DAY) },
  { _id: 't9', type: 'deposit', status: 'failed', amount: 700000, description: 'Nạp tiền', metadata: {}, createdAt: iso(9 * DAY) },
];

// ---------- dashboards ----------
const adminDash = {
  users: { total: 1248, byRole: { user: 1231, moderator: 15, admin: 2 } },
  products: { total: 3860, byStatus: { active: 2410, sold: 980, hidden: 320, deleted: 150 }, byCategory: [{ category: 'Điện tử', count: 1020 }, { category: 'Thời trang', count: 860 }, { category: 'Đồ gia dụng', count: 640 }, { category: 'Sách', count: 410 }, { category: 'Thể thao', count: 300 }] },
  orders: { total: 2150, byStatus: { completed: 1380, shipped: 190, paid: 140, awaiting_payment: 210, cancelled: 160, disputed: 70 }, monthly: [{ month: '06/2026', count: 220 }, { month: '07/2026', count: 280 }, { month: '08/2026', count: 310 }, { month: '09/2026', count: 350 }, { month: '10/2026', count: 420 }, { month: '11/2026', count: 570 }] },
  transactions: { feeRevenueVnd: 84250000 },
  disputes: { byStatus: { pending: 14, investigating: 9, resolved: 120, dismissed: 11 } },
  purchaseRequests: { byStatus: { pending: 37, accepted: 410 } },
  reports: { byStatus: { pending: 22, reviewing: 8, resolved: 150 } },
  pendingWithdrawals: 12, wallets: { total: 1190 }, generatedAt: iso(1),
};
const staffDash = {
  openDisputes: 23, pendingPurchaseRequests: 37, openOrders: 540, activeDeliveries: 190,
  recentQueue: [{ label: 'Báo cáo chờ xử lý', count: 22 }, { label: 'Tranh chấp đang mở', count: 23 }, { label: 'Yêu cầu rút tiền', count: 12 }, { label: 'Đánh giá chờ duyệt', count: 0 }, { label: 'Đơn đang vận chuyển', count: 190 }],
  generatedAt: iso(1),
};
const abandoned = { recovered: 64, active: 41, lost: 28, recoveryRate: 48, recoveredAmount: 52300000, activeAmount: 31400000, lostAmount: 18900000, bySource: { order: { total: 92 }, cart: { total: 41 } } };

// ---------- staff lists ----------
const adminUsers = [
  { _id: 'au1', fullName: 'Quản trị Hệ thống', email: 'admin@secondsafe.vn', role: 'admin', createdAt: iso(500 * DAY) },
  { _id: 'au2', fullName: 'Nguyễn Thu Hà', email: 'ha.moderator@secondsafe.vn', role: 'moderator', createdAt: iso(200 * DAY) },
  { _id: 'au3', fullName: 'Trịnh Đức Long', email: 'long.mod@secondsafe.vn', role: 'moderator', isSuspended: true, createdAt: iso(180 * DAY) },
  { _id: 'au4', fullName: 'Trần Minh Anh', email: 'minhanh@example.com', role: 'user', createdAt: iso(90 * DAY) },
  { _id: 'au5', fullName: 'Lê Thị Hoa', email: 'hoa.le@example.com', role: 'user', isSellingRestricted: true, createdAt: iso(60 * DAY) },
  { _id: 'au6', fullName: 'Phạm Quốc Bảo', email: 'bao.pham@example.com', role: 'user', createdAt: iso(30 * DAY) },
];
const hex = (i) => 'a1b2c3d4e5f6a1b2c3d4e5' + String(10 + i).padStart(2, '0');
const reports = [
  { _id: hex(1), reportType: 'user', reporterId: people[0], reportedUserId: people[1], reason: 'Lừa đảo, không giao hàng', status: 'pending', reportedUserStats: { warningCount: 2, totalReports: 4, isSuspended: false } },
  { _id: hex(2), reportType: 'product', reporterId: people[2], productId: { title: 'Đồng hồ Rolex Submariner giá rẻ' }, reason: 'Hàng giả, hàng nhái', status: 'reviewing', productStats: { warningActions: 3, totalReports: 7, isRemoved: false } },
  { _id: hex(3), reportType: 'user', reporterId: people[3], reportedUserId: people[4], reason: 'Ngôn từ xúc phạm trong chat', status: 'resolved', reportedUserStats: { warningCount: 0, totalReports: 1 } },
  { _id: hex(4), reportType: 'product', reporterId: people[5], productId: { title: 'Laptop Dell XPS 13 cũ' }, reason: 'Sai mô tả sản phẩm', status: 'dismissed', productStats: { warningActions: 0, totalReports: 1, isRemoved: false } },
  { _id: hex(5), reportType: 'user', reporterId: people[1], reportedUserId: people[2], reason: 'Spam tin nhắn quảng cáo', status: 'pending', reportedUserStats: { warningCount: 5, totalReports: 8, isSuspended: true } },
];
const modOrders = [
  { _id: hex(11), orderCode: 'SS-10024', buyerId: people[0], sellerId: s1, trackingNumber: 'GHN8827364510', totalToPay: 12650000, status: 'shipped' },
  { _id: hex(12), orderCode: 'SS-10023', buyerId: people[1], sellerId: s1, totalToPay: 940000, status: 'awaiting_payment' },
  { _id: hex(13), orderCode: 'SS-10022', buyerId: people[2], sellerId: people[3], trackingNumber: 'GHTK55218', totalToPay: 2150000, status: 'delivered' },
  { _id: hex(14), orderCode: 'SS-10021', buyerId: people[3], sellerId: people[4], totalToPay: 450000, status: 'paid' },
  { _id: hex(15), orderCode: 'SS-10020', buyerId: people[4], sellerId: s1, trackingNumber: 'VTP998877', totalToPay: 1580000, status: 'completed' },
  { _id: hex(16), orderCode: 'SS-10019', buyerId: people[5], sellerId: people[0], totalToPay: 3200000, status: 'disputed' },
  { _id: hex(17), orderCode: 'SS-10018', buyerId: people[0], sellerId: people[2], totalToPay: 780000, status: 'cancelled' },
];
const disputes = [
  { _id: hex(21), buyerId: people[0], sellerId: s1, reason: 'not_as_described', status: 'pending' },
  { _id: hex(22), buyerId: people[1], sellerId: people[2], reason: 'damaged', status: 'investigating' },
  { _id: hex(23), buyerId: people[3], sellerId: people[4], reason: 'not_received', status: 'resolved' },
  { _id: hex(24), buyerId: people[5], sellerId: s1, reason: 'return_request', status: 'pending' },
  { _id: hex(25), buyerId: people[2], sellerId: people[0], reason: 'counterfeit', status: 'investigating' },
];
const withdrawals = [
  { _id: hex(31), userId: people[0], amount: 5000000, metadata: { bankName: 'Vietcombank', bankAccount: '0071000888999' }, status: 'pending' },
  { _id: hex(32), userId: people[1], amount: 1200000, metadata: { bankName: 'Techcombank', bankAccount: '19036677889900' }, status: 'completed' },
  { _id: hex(33), userId: s1, amount: 12500000, metadata: { bankName: 'MB Bank', bankAccount: '0987654321' }, status: 'pending' },
  { _id: hex(34), userId: people[3], amount: 300000, metadata: { bankName: 'ACB', bankAccount: '2233445566' }, status: 'failed' },
  { _id: hex(35), userId: people[4], amount: 2750000, metadata: { bankName: 'BIDV', bankAccount: '12010000778899' }, status: 'completed' },
];
const reviewsList = [
  { _id: hex(41), reviewerId: people[0], reviewedUserId: s1, productId: { title: 'iPhone 13 Pro 128GB' }, orderId: { agreedAmount: 12500000 }, rating: 5, comment: 'Máy đúng mô tả, giao nhanh, người bán nhiệt tình.', status: 'normal', moderatorAssessment: {} },
  { _id: hex(42), reviewerId: people[1], reviewedUserId: people[2], productId: { title: 'Giày Nike Air Force 1' }, orderId: { agreedAmount: 890000 }, rating: 1, comment: 'Lừa đảo, hàng không như hình, đừng mua!!!', status: 'reported', moderatorAssessment: {} },
  { _id: hex(43), reviewerId: people[2], reviewedUserId: people[3], productId: { title: 'Bàn học gỗ sồi' }, orderId: { agreedAmount: 1450000 }, rating: 4, comment: 'Tốt, hơi trầy nhẹ ở chân bàn.', status: 'normal', moderatorAssessment: { isReviewed: true, verdict: 'good' } },
  { _id: hex(44), reviewerId: people[3], reviewedUserId: people[4], productId: { title: 'Vợt cầu lông Yonex' }, orderId: { agreedAmount: 2100000 }, rating: 2, comment: 'Chửi bới người bán, nội dung vi phạm.', status: 'hidden', moderatorAssessment: { isBad: true, verdict: 'bad', penaltyLevel: 2 } },
  { _id: hex(45), reviewerId: people[4], reviewedUserId: s1, productId: { title: 'Máy ảnh Fujifilm X-T30' }, orderId: { agreedAmount: 15800000 }, rating: 5, comment: '', status: 'normal', moderatorAssessment: {} },
];
const revenue = {
  summary: { completedOrders: 1380, grossRevenue: 1685000000, platformRevenue: 84250000, sellerPayout: 1600750000 },
  breakdown: ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'].map((p, i) => ({ period: p, completedOrders: 80 + i * 12, grossRevenue: (90 + i * 14) * 1000000, platformRevenue: (90 + i * 14) * 50000, sellerPayout: (90 + i * 14) * 950000 })),
  topProducts: [
    { productId: 'p1', title: 'iPhone 13 Pro 128GB còn bảo hành', completedOrders: 24, grossRevenue: 300000000, platformRevenue: 15000000, sellerPayout: 285000000 },
    { productId: 'p2', title: 'MacBook Air M1 2020 8GB/256GB', completedOrders: 18, grossRevenue: 252000000, platformRevenue: 12600000, sellerPayout: 239400000 },
    { productId: 'p3', title: 'Máy ảnh Fujifilm X-T30 body', completedOrders: 11, grossRevenue: 173800000, platformRevenue: 8690000, sellerPayout: 165110000 },
    { productId: 'p4', title: 'Sony WH-1000XM4 chính hãng', completedOrders: 29, grossRevenue: 130500000, platformRevenue: 6525000, sellerPayout: 123975000 },
  ],
  recentOrders: [
    { orderId: hex(11), orderCode: 'SS-10024', productTitle: 'iPhone 13 Pro 128GB', buyerName: 'Lê Thị Hoa', sellerName: 'Nguyễn Văn An', grossRevenue: 12500000, platformRevenue: 625000, sellerPayout: 11875000, completedAt: iso(300) },
    { orderId: hex(12), orderCode: 'SS-10023', productTitle: 'Giày Nike Air Force 1', buyerName: 'Phạm Quốc Bảo', sellerName: 'Nguyễn Văn An', grossRevenue: 890000, platformRevenue: 44500, sellerPayout: 845500, completedAt: iso(1500) },
    { orderId: hex(13), orderCode: 'SS-10022', productTitle: 'Vợt cầu lông Yonex Astrox 88D', buyerName: 'Võ Thanh Tùng', sellerName: 'Đặng Mỹ Linh', grossRevenue: 2100000, platformRevenue: 105000, sellerPayout: 1995000, completedAt: iso(3000) },
  ],
};

const list = (key, arr) => ({ [key]: arr, pagination: { page: 1, limit: 10, total: arr.length, totalPages: 1 } });

function body(role, urlStr) {
  const u = new URL(urlStr);
  const p = u.pathname.replace(/^\/api/, '');
  const prof = role === 'admin' ? { _id: 'a1', id: 'a1', fullName: 'Quản trị viên', email: 'admin@secondsafe.vn', role: 'admin' }
    : role === 'moderator' ? { _id: 'm1', id: 'm1', fullName: 'Nguyễn Thu Hà', email: 'mod@secondsafe.vn', role: 'moderator' }
    : { ...me, role: 'user' };
  if (p === '/auth/profile') return prof;
  if (p === '/notifications/unread-count') return { unreadCount: 0, count: 0 };
  if (p.startsWith('/notifications')) return { notifications: [], total: 0, unreadCount: 0 };
  // buyer
  if (p === '/orders/selling') return { orders: sellerOrders, total: sellerOrders.length, page: 1, totalPages: 1 };
  let m;
  if ((m = p.match(/^\/orders\/(o\d)$/))) return orderById[m[1]];
  if (/^\/reviews\/orders\/[^/]+\/can-review/.test(p)) return { canReview: false };
  if (/^\/reviews\/orders\/[^/]+\/review/.test(p)) return null;
  if (p === '/products/my-products') return { products: myProducts, total: myProducts.length, page: 1, totalPages: 1, limit: 20 };
  if (p === '/products') return { products: myProducts.slice(0, 4).map((x) => ({ ...x, status: 'active' })), total: 4, page: 1, totalPages: 1 };
  if (p === '/wallets/balance') return { balance: 1250000, totalDeposited: 2000000, totalWithdrawn: 1000000, pendingWithdrawalAmount: 500000, totalSpent: 890000, totalEarned: 1237500 };
  if (p === '/wallets/transactions') return { transactions: txs, pagination: { page: 1, limit: 10, total: txs.length, totalPages: 1 } };
  if (/^\/users\/s1\/public/.test(p)) return { ...s1, rating: 4.8, totalReviews: 37 };
  if (/^\/users\/s1\/stats/.test(p)) return { rating: 4.8, totalReviews: 37 };
  if (/^\/reviews\/users\/s1\/rating-stats/.test(p)) return { averageRating: 4.8, totalReviews: 37 };
  if (/^\/reviews\/users\/s1\/reviews/.test(p)) return { reviews: reviewsList.slice(0, 3).map((r) => ({ ...r, reviewer: r.reviewerId, createdAt: iso(5 * DAY) })), pagination: { page: 1, totalPages: 1, total: 3 } };
  // staff
  if (p === '/users/admin/dashboard') return adminDash;
  if (p === '/moderator/dashboard') return staffDash;
  if (p === '/abandoned-checkouts/summary') return abandoned;
  if (p === '/users/admin/users') return list('users', adminUsers);
  if (p === '/moderator/reports') return list('reports', reports);
  if (p === '/moderator/orders') return list('orders', modOrders);
  if (p === '/moderator/disputes') return list('disputes', disputes);
  if (p === '/moderator/withdrawals') return list('withdrawals', withdrawals);
  if (p === '/moderator/reviews') return list('reviews', reviewsList);
  if (p === '/moderator/revenue-report') return revenue;
  return [];
}

// Scans the page for saturated blue/purple/pink/orange/red colours and returns the offending classes.
const HUE_SCAN = () => {
  const out = new Map();
  const toHsl = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    if (mx === mn) return [0, 0, l];
    const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, s, l];
  };
  const name = (h) => (h < 15 || h >= 345 ? 'red' : h < 45 ? 'orange' : h < 70 ? 'amber' : h < 170 ? 'green' : h < 200 ? 'cyan' : h < 255 ? 'blue' : h < 290 ? 'purple' : 'pink');
  const root = document.querySelector('#main-content') || document.body;
  root.querySelectorAll('*').forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const props = [['background-color', cs.backgroundColor], ['border-top-color', cs.borderTopWidth !== '0px' ? cs.borderTopColor : null], ['border-bottom-color', cs.borderBottomWidth !== '0px' ? cs.borderBottomColor : null], ['color', own ? cs.color : null], ['border-left-color', cs.borderLeftWidth !== '0px' ? cs.borderLeftColor : null]];
    for (const [prop, val] of props) {
      if (!val) continue;
      const m = val.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/);
      if (!m) continue;
      const a = m[4] === undefined ? 1 : parseFloat(m[4]);
      if (a < 0.4) continue;
      const [h, s, l] = toHsl(+m[1], +m[2], +m[3]);
      if (s < 0.3 || l > 0.97 || l < 0.08) continue;
      const hue = name(h);
      if (hue === 'green' || hue === 'amber') continue;
      const cls = (el.className && el.className.baseVal === undefined ? String(el.className) : '').split(/\s+/).filter(Boolean).slice(0, 3).join('.') || el.tagName.toLowerCase();
      const key = `${hue}|${prop}|${val}|${cls}`;
      if (!out.has(key)) out.set(key, { hue, prop, val, cls, text: (el.textContent || '').trim().slice(0, 30) });
    }
  });
  return [...out.values()].slice(0, 40);
};

const OVERFLOW = () => {
  const r = [];
  const de = document.documentElement;
  if (de.scrollWidth > de.clientWidth + 1) r.push(`PAGE scrollWidth ${de.scrollWidth} > ${de.clientWidth}`);
  document.querySelectorAll('.ant-table-content, .ant-table-body, .ant-table-container, table, .admin-table-container, [class*=table-wrap], [class*=scroll]').forEach((el) => {
    if (el.scrollWidth > el.clientWidth + 2) r.push(`${el.tagName}.${String(el.className).split(' ').slice(0, 2).join('.')} ${el.scrollWidth}>${el.clientWidth}`);
  });
  return r.slice(0, 8);
};

const scenarios = [
  // [role, name, url, viewport, opts]
  ['user', 'buyer-seller-orders', '/seller-orders', [1280, 800]],
  ['user', 'buyer-seller-orders-completed-tab', '/seller-orders', [1280, 800], { click: /Hoàn thành/ }],
  ['user', 'buyer-order-detail-shipped', '/orders/o1', [1280, 800]],
  ['user', 'buyer-order-detail-pending', '/orders/o2', [1280, 800]],
  ['user', 'buyer-order-detail-completed', '/orders/o3', [1280, 800]],
  ['user', 'buyer-order-payment', '/orders/o2/pay', [1280, 800]],
  ['user', 'buyer-my-products', '/my-products', [1280, 800]],
  ['user', 'buyer-wallet', '/wallet', [1280, 800], { scroll: '.transactions-list' }],
  ['user', 'buyer-seller-profile', '/user/s1', [1280, 800]],
  ['user', 'buyer-seller-reviews', '/user/s1/reviews', [1280, 800]],
  ['admin', 'dash-admin', '/admin', [1440, 900]],
  ['moderator', 'dash-staff', '/staff', [1440, 900]],
  ['moderator', 'dash-moderator-dashboard', '/moderator/dashboard', [1440, 900]],
  ['admin', 'admin-users', '/admin/users', [1440, 900]],
  ['admin', 'admin-orders', '/admin/orders', [1440, 900]],
  ['admin', 'admin-reports', '/admin/reports', [1440, 900]],
  ['admin', 'admin-reviews', '/admin/reviews', [1440, 900]],
  ['admin', 'admin-withdrawals', '/admin/withdrawals', [1440, 900]],
  ['admin', 'admin-revenue', '/admin/revenue', [1440, 900]],
  ['admin', 'admin-disputes', '/admin/disputes', [1440, 900]],
  ['moderator', 'mod-orders', '/moderator/orders', [1440, 900]],
  ['moderator', 'mod-reports', '/moderator/reports', [1440, 900]],
  ['moderator', 'mod-disputes', '/moderator/disputes', [1440, 900]],
  ['moderator', 'mod-withdrawals', '/moderator/withdrawals', [1440, 900]],
  ['moderator', 'mod-reviews', '/moderator/reviews', [1440, 900]],
];


module.exports = { server, body, PORT, iso, DAY, IMG, me, s1, people, hex, myProducts, orderListing, buyerOrder, HUE_SCAN, OVERFLOW, sellerOrders, loc, P, OUT };
