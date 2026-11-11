// Integration run against a disposable MongoDB replica set.
// Usage: node integration-runner.js <backend directory> <comma separated sections>
// Each section creates its own accounts and data, calls the HTTP API through the Express app and
// checks the result in the database. Nothing outside the disposable database is read or written,
// except upload files, which are removed at the end.
const fs = require('fs');
const path = require('path');

const B = path.resolve(process.argv[2]);
const wanted = (process.argv[3] || '').split(',').filter(Boolean);
process.env.MONGODB_URI = process.env.INTEGRATION_MONGODB_URI || 'mongodb://127.0.0.1:27099/secondsafe_integration?directConnection=true';
process.env.JWT_SECRET = 'integration-secret-integration-secret-1234';
process.env.CHAT_ENCRYPTION_KEY = 'integration-chat-key-integration-chat-123';
process.env.LOG_LEVEL = 'silent';
const req = name => require(path.join(B, name));
const optional = name => { try { return req(name); } catch (error) { if (error.code === 'MODULE_NOT_FOUND') return null; throw error; } };

const mongoose = req('node_modules/mongoose');
const request = req('node_modules/supertest');
const logger = req('src/common/utils/logger.util');
for (const level of ['error', 'warn', 'info', 'debug']) logger[level] = () => {};
const app = req('src/app');
const User = req('src/modules/users/user.model');
const Category = req('src/modules/products/category.model');
const Product = req('src/modules/products/product.model');
const Order = req('src/modules/orders/order.model');
const Dispute = req('src/modules/reports/dispute.model');
const walletService = req('src/modules/payments/wallet.service');
const { generateJWT } = req('src/common/utils/jwt.util');
const api = request(app);

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
const uploaded = [];
let failures = 0;
let checks = 0;
let counter = 0;

function check(label, condition, detail) {
  checks += 1;
  if (condition) return console.log(`  ok   ${label}`);
  failures += 1;
  return console.log(`  FAIL ${label}${detail === undefined ? '' : ' -> ' + JSON.stringify(detail).slice(0, 300)}`);
}

const as = user => ({ Authorization: `Bearer ${generateJWT({ userId: user._id })}` });
const balance = async user => (await walletService.getBalance(user._id)).balance;

async function account(role = 'user', funds = 0) {
  counter += 1;
  const user = await User.create({
    email: `${role}${counter}@integration.test`, password: '$2a$10$integrationintegrationintegrationintegrationintegratio',
    fullName: `${role} ${counter}`, role, phone: '0900000000', address: '1 Lê Lợi, Quận 1, Hồ Chí Minh', isVerified: true
  });
  if (funds) await walletService.incrementBalance(user._id, funds, 'deposit', 'integration');
  return user;
}

async function upload(user, route = '/api/upload/images', field = 'images', name = 'a.png', content = PNG) {
  const response = await api.post(route).set(as(user)).attach(field, content, name);
  const files = Array.isArray(response.body.data) ? response.body.data : [];
  uploaded.push(...files.map(file => file.path));
  return response;
}

let image;
async function listing(seller, price = 100000, title = `Sách ${counter += 1}`) {
  image = image || (await upload(seller)).body.data[0].path;
  return api.post('/api/products').set(as(seller)).send({
    title, description: 'Mô tả sản phẩm đầy đủ', price, condition: 'good', images: [image],
    location: { city: 'Hồ Chí Minh', district: 'Quận 1' }, category: 'sach'
  });
}

async function quickBuy(buyer, product) {
  const response = await api.post('/api/orders/purchase-request').set(as(buyer)).send({ listingId: product._id, message: 'Mua ngay', agreedPrice: product.price });
  return { response, order: await Order.findOne({ productId: product._id, buyerId: buyer._id }).sort({ createdAt: -1 }) };
}

// Creates a listing and moves an order for it to the requested status through the public API.
async function orderAt(status, price = 100000) {
  const seller = await account('user');
  const buyer = await account('user', 5000000);
  const product = (await listing(seller, price)).body.data;
  const { order } = await quickBuy(buyer, product);
  const steps = [
    ['paid', () => api.post(`/api/orders/${order._id}/pay`).set(as(buyer))],
    ['shipped', () => api.post(`/api/orders/${order._id}/ship`).set(as(seller)).send({ provider: 'GHN', trackingNumber: `GHN${counter}`, shippingProvider: 'GHN', carrier: 'GHN' })],
    ['delivered', () => api.post(`/api/orders/${order._id}/deliver`).set(as(seller))],
    ['completed', () => api.post(`/api/orders/${order._id}/confirm-receipt`).set(as(buyer))]
  ];
  for (const [name, step] of steps) {
    if (status === 'awaiting_payment') break;
    const response = await step();
    if (response.status !== 200) throw new Error(`could not move order to ${name}: ${JSON.stringify(response.body)}`);
    if (name === status) break;
  }
  return { seller, buyer, product, order: await Order.findById(order._id) };
}

async function evidenceFile(user) {
  return (await upload(user, '/api/upload/evidence', 'files', 'proof.png')).body.data[0].path;
}

const sections = {
  async upload() {
    const user = await account();
    let r = await upload(user);
    check('png image accepted with a random stored name', r.status === 200 && /^\/uploads\/products\/temp\/\d+-[a-f\d]{16}\.png$/.test(r.body.data?.[0]?.path), r.body);
    r = await api.post('/api/upload/images?productId=../../x').set(as(user)).attach('images', PNG, 'a.png');
    uploaded.push(r.body.data?.[0]?.path);
    check('a path as upload target falls back to the temp folder', r.status === 200 && r.body.data[0].path.startsWith('/uploads/products/temp/'), r.body);
    check('an executable is rejected', (await upload(user, '/api/upload/images', 'images', 'a.exe', Buffer.from('MZ'))).status === 400);
    check('text renamed to .png is rejected by its signature', (await upload(user, '/api/upload/images', 'images', 'fake.png', Buffer.from('<script>'))).status === 400);
    check('upload without a session is rejected', (await api.post('/api/upload/images').attach('images', PNG, 'a.png')).status === 401);
    r = await upload(user, '/api/upload/evidence', 'files', 'proof.png');
    check('evidence image accepted', r.status === 200 && r.body.data[0].path.startsWith('/uploads/evidence/temp/'), r.body);
    check('gif is not accepted as evidence', (await upload(user, '/api/upload/evidence', 'files', 'a.gif', Buffer.from('GIF89a000000'))).status === 400);
  },

  async listing() {
    const seller = await account();
    const other = await account();
    let r = await listing(seller, 100000);
    check('listing created active', r.status === 201 && r.body.data?.status === 'active', r.body);
    const product = r.body.data;
    check('fractional price rejected', (await listing(seller, 100.5)).status === 400);
    check('free listing accepted (integer VND >= 0)', (await listing(seller, 0)).status === 201);
    r = await api.post('/api/products').set(as(seller)).send({ title: 'Thiếu ảnh', description: 'Mô tả', price: 1000, condition: 'good', images: [], location: { city: 'A', district: 'B' }, category: 'sach' });
    check('listing without an image rejected', r.status === 400, r.body);
    check('non-owner edit refused', (await api.put(`/api/products/${product._id}`).set(as(other)).send({ price: 1 })).status === 403);
    r = await api.put(`/api/products/${product._id}`).set(as(seller)).send({ price: 110000, status: 'sold', seller: other._id });
    check('owner edit changes only editable fields', r.status === 200 && r.body.data.price === 110000 && r.body.data.status === 'active' && String((await Product.findById(product._id)).seller) === String(seller._id), r.body);
    r = await api.patch(`/api/products/${product._id}/visibility`).set(as(seller)).send({ status: 'hidden' });
    check('owner hides the listing', r.status === 200 && r.body.data.status === 'hidden', r.body);
    check('hidden listing is not public', (await api.get(`/api/products/${product._id}`)).status === 404);
    await api.patch(`/api/products/${product._id}/visibility`).set(as(seller)).send({ status: 'active' });
    const buyer = await account('user', 1000000);
    await quickBuy(buyer, { _id: product._id, price: 110000 });
    check('listing tied to an open order is read-only', (await api.put(`/api/products/${product._id}`).set(as(seller)).send({ price: 5 })).status === 403);
    check('listing tied to an open order cannot be deleted', (await api.delete(`/api/products/${product._id}`).set(as(seller))).status === 403);
    const spare = (await listing(seller, 5000)).body.data;
    r = await api.delete(`/api/products/${spare._id}`).set(as(seller));
    check('delete is a soft delete', r.status === 200 && (await Product.findById(spare._id)).status === 'deleted', r.body);
    await User.updateOne({ _id: seller._id }, { isSellingRestricted: true, sellingRestrictedReason: 'integration' });
    check('restricted seller cannot publish', (await listing(seller, 1000)).status === 403);
  },

  async 'seller-listings'() {
    const seller = await account();
    const other = await account();
    const product = (await listing(seller, 70000)).body.data;
    await listing(other, 80000);
    let r = await api.get('/api/products/my-products').set(as(seller));
    check('my-products lists only the caller listings', r.status === 200 && r.body.data.products.length === 1 && r.body.data.products[0].isInActiveOrder === false, r.body);
    await api.patch(`/api/products/${product._id}/visibility`).set(as(seller)).send({ status: 'hidden' });
    r = await api.get('/api/products/my-products?status=hidden').set(as(seller));
    check('my-products filters by status', r.body.data.total === 1 && r.body.data.limit === 20, r.body.data);
    check('owner opens their hidden listing', (await api.get(`/api/products/${product._id}`).set(as(seller))).status === 200);
    check('another user cannot open it', (await api.get(`/api/products/${product._id}`).set(as(other))).status === 404);
    await api.patch(`/api/products/${product._id}/visibility`).set(as(seller)).send({ status: 'active' });
    r = await api.get(`/api/products?seller=${seller._id}`);
    check('public list narrows to one seller', r.body.data.total === 1 && String(r.body.data.products[0]._id) === String(product._id), r.body.data);
    r = await api.get(`/api/products/${product._id}`);
    check('detail carries a seller summary without contact data', r.status === 200 && r.body.data.seller.fullName && !r.body.data.seller.email && !r.body.data.seller.phone, r.body.data?.seller);
    await User.updateOne({ _id: seller._id }, { isSuspended: true });
    check('listing of a suspended seller is not found', (await api.get(`/api/products/${product._id}`)).status === 404);
  },

  async reviews() {
    const { seller, buyer, order } = await orderAt('delivered');
    const stranger = await account();
    let r = await api.get(`/api/reviews/orders/${order._id}/can-review`).set(as(buyer));
    check('cannot review before completion', r.body.data?.canReview === false, r.body);
    await api.post(`/api/orders/${order._id}/confirm-receipt`).set(as(buyer));
    check('can review after completion', (await api.get(`/api/reviews/orders/${order._id}/can-review`).set(as(buyer))).body.data?.canReview === true);
    check('someone else cannot review the order', (await api.post(`/api/reviews/orders/${order._id}/rate`).set(as(stranger)).send({ rating: 5 })).status === 403);
    check('rating outside 1-5 rejected', (await api.post(`/api/reviews/orders/${order._id}/rate`).set(as(buyer)).send({ rating: 6 })).status === 400);
    const evidence = await evidenceFile(buyer);
    r = await api.post(`/api/reviews/orders/${order._id}/rate`).set(as(buyer)).send({ rating: 2, comment: 'Hàng không như mô tả', evidenceFiles: [evidence] });
    check('buyer reviews with evidence', r.status === 200 && r.body.data.rating === 2 && r.body.data.evidenceFiles.length === 1, r.body);
    const reviewId = r.body.data?._id;
    check('one review per order', (await api.post(`/api/reviews/orders/${order._id}/rate`).set(as(buyer)).send({ rating: 5 })).status === 409);
    r = await api.get(`/api/reviews/users/${seller._id}/rating-stats`);
    check('public rating statistics', r.body.data?.totalReviews === 1 && r.body.data.averageRating === 2 && r.body.data.distribution['2'] === 1, r.body);
    check('seller rating recalculated', (await User.findById(seller._id)).rating === 2);
    check('public review list', (await api.get(`/api/reviews/users/${seller._id}/reviews`)).body.data?.reviews?.length === 1);
    r = await api.get('/api/reviews/reviews/my-reviews').set(as(buyer));
    check('my-reviews resolves before :reviewId', r.status === 200 && r.body.data.reviews.length === 1, r.body);
    check('only the author edits', (await api.put(`/api/reviews/reviews/${reviewId}`).set(as(stranger)).send({ rating: 5 })).status === 403);
    r = await api.put(`/api/reviews/reviews/${reviewId}`).set(as(buyer)).send({ rating: 4 });
    check('author edit recalculates the rating', r.status === 200 && (await User.findById(seller._id)).rating === 4, r.body);
    r = await api.delete(`/api/reviews/reviews/${reviewId}`).set(as(buyer));
    check('author removal hides the review and recalculates', r.status === 200 && (await User.findById(seller._id)).totalReviews === 0, r.body);
  },

  async reports() {
    const seller = await account();
    const [reporter, second, third, stranger] = [await account(), await account(), await account(), await account()];
    const product = (await listing(seller)).body.data;
    const body = { productId: product._id, reason: 'scam', description: 'Tin đăng có dấu hiệu lừa đảo' };
    let r = await api.post('/api/reports/product').set(as(reporter)).send(body);
    check('listing report created', r.status === 200 && r.body.data.status === 'pending', r.body);
    const reportId = r.body.data?._id;
    check('unknown reason rejected', (await api.post('/api/reports/product').set(as(second)).send({ ...body, reason: 'dislike' })).status === 400);
    check('short description rejected', (await api.post('/api/reports/product').set(as(second)).send({ ...body, description: 'ngắn' })).status === 400);
    check('description over 1000 characters rejected', (await api.post('/api/reports/product').set(as(second)).send({ ...body, description: 'a'.repeat(1001) })).status === 400);
    check('own listing cannot be reported', (await api.post('/api/reports/product').set(as(seller)).send(body)).status === 400);
    check('same listing cannot be reported twice', (await api.post('/api/reports/product').set(as(reporter)).send(body)).status === 400);
    check('self report rejected', (await api.post('/api/reports/user').set(as(reporter)).send({ reportedUserId: reporter._id, reason: 'spam', description: 'Tự báo cáo chính mình' })).status === 400);
    check('reporter reads the report', (await api.get(`/api/reports/${reportId}`).set(as(reporter))).body.data?.reporterId?._id === String(reporter._id));
    r = await api.get(`/api/reports/${reportId}`).set(as(seller));
    check('reported user gets a view without the reporter', r.status === 200 && !('reporterId' in r.body.data) && !JSON.stringify(r.body.data).includes(String(reporter._id)), r.body.data);
    check('unrelated user is refused', (await api.get(`/api/reports/${reportId}`).set(as(stranger))).status === 403);
    check('users cannot list every report', (await api.get('/api/reports').set(as(reporter))).status === 403);
    r = await api.get('/api/reports/my-reports').set(as(reporter));
    check('reporter lists own reports', r.status === 200 && r.body.data.reports.length === 1, r.body);
    await api.post('/api/reports/product').set(as(second)).send(body);
    check('two open reports do not restrict yet', !(await User.findById(seller._id)).isSellingRestricted);
    await api.post('/api/reports/product').set(as(third)).send(body);
    check('third open report restricts the seller automatically', (await User.findById(seller._id)).isSellingRestricted === true);
  },

  async disputes() {
    const { seller, buyer, order } = await orderAt('shipped');
    const stranger = await account();
    const evidence = await evidenceFile(buyer);
    const body = { reason: 'not_as_described', description: 'Sản phẩm bị rách nhiều trang', evidenceImages: [evidence] };
    check('evidence from elsewhere rejected', (await api.post(`/api/orders/${order._id}/dispute`).set(as(buyer)).send({ ...body, evidenceImages: ['https://evil.example/x.jpg'] })).status === 400);
    check('seller cannot open a dispute', (await api.post(`/api/orders/${order._id}/dispute`).set(as(seller)).send(body)).status === 400);
    let r = await api.post(`/api/orders/${order._id}/dispute`).set(as(buyer)).send(body);
    check('buyer opens a dispute', r.status === 200 && r.body.data.status === 'pending', r.body);
    const disputeId = r.body.data?._id;
    check('order moved to disputed', (await Order.findById(order._id)).status === 'disputed');
    check('one dispute per order', (await api.post(`/api/orders/${order._id}/dispute`).set(as(buyer)).send(body)).status === 400);
    check('unrelated user cannot read the dispute', (await api.get(`/api/disputes/${disputeId}`).set(as(stranger))).status !== 200);
    check('seller reads the dispute', (await api.get(`/api/disputes/${disputeId}`).set(as(seller))).status === 200);
    check('seller cannot respond before investigation', (await api.post(`/api/disputes/${disputeId}/respond`).set(as(seller)).send({ response: 'Tôi đã gửi đúng hàng' })).status === 400);
    await Dispute.updateOne({ _id: disputeId }, { status: 'investigating' });
    check('seller responds during investigation', (await api.post(`/api/disputes/${disputeId}/respond`).set(as(seller)).send({ response: 'Tôi đã gửi đúng hàng' })).status === 200);
    check('buyer follow-up needs a note or a file', (await api.post(`/api/disputes/${disputeId}/buyer-follow-up`).set(as(buyer)).send({ note: ' ' })).status === 400);
    check('buyer adds a note', (await api.post(`/api/disputes/${disputeId}/buyer-follow-up`).set(as(buyer)).send({ note: 'Bổ sung ảnh chụp' })).status === 200);
    check('return confirmation only for return requests', (await api.post(`/api/disputes/${disputeId}/confirm-return`).set(as(seller))).status === 400);
    r = await api.get('/api/disputes/my-disputes').set(as(seller));
    check('seller sees the dispute in their list', r.status === 200 && r.body.data.disputes.length === 1, r.body);
    check('conversation recorded for both sides', (await Dispute.findById(disputeId)).disputeConversation.length === 3);
    return { disputeId, seller, buyer, order };
  },

  async revenue() {
    const moderator = await account('moderator');
    await orderAt('completed', 200000);
    let r = await api.get('/api/moderator/revenue-report').set(as(moderator));
    check('revenue report over completed orders', r.status === 200 && r.body.data.summary.completedOrders >= 1 && r.body.data.rule.platformFeeRate === 0.05, r.body.data?.summary);
    check('payout equals gross minus fee', r.body.data.summary.sellerPayout === r.body.data.summary.grossRevenue - r.body.data.summary.platformRevenue);
    check('report grouped by month', /^\d{4}-\d{2}$/.test(r.body.data.breakdown[0]?.period), r.body.data.breakdown);
    check('reversed range rejected', (await api.get('/api/moderator/revenue-report?from=2026-12-01&to=2026-01-01').set(as(moderator))).status === 400);
    check('users cannot read the revenue report', (await api.get('/api/moderator/revenue-report').set(as(await account()))).status === 403);
  },

  async 'report-moderation'() {
    const [moderator, seller, reporter, target] = [await account('moderator'), await account(), await account(), await account()];
    const product = (await listing(seller)).body.data;
    const reportId = (await api.post('/api/reports/product').set(as(reporter)).send({ productId: product._id, reason: 'counterfeit', description: 'Hàng giả mạo thương hiệu' })).body.data._id;
    let r = await api.get('/api/moderator/reports?status=pending&keyword=(a%2B)%2B%24').set(as(moderator));
    check('keyword with regex characters is searched literally', r.status === 200 && r.body.data.reports.length === 0, r.body);
    r = await api.get('/api/moderator/reports?status=pending').set(as(moderator));
    check('moderator lists pending reports with target statistics', r.status === 200 && r.body.data.reports.some(item => String(item._id) === String(reportId)), r.body);
    check('moderator opens a report', (await api.get(`/api/moderator/reports/${reportId}`).set(as(moderator))).status === 200);
    check('users cannot use the moderator console', (await api.get('/api/moderator/reports').set(as(reporter))).status === 403);
    check('dismissal cannot sanction', (await api.put(`/api/moderator/reports/${reportId}/resolve`).set(as(moderator)).send({ status: 'dismissed', moderatorDecision: 'warn_user' })).status === 400);
    r = await api.put(`/api/moderator/reports/${reportId}/resolve`).set(as(moderator)).send({ status: 'resolved', moderatorDecision: 'warn_user', moderatorNotes: 'Cảnh báo lần đầu', moderatorReply: 'Đã xử lý' });
    check('warn_user resolves the report and counts a warning', r.status === 200 && r.body.data.status === 'resolved' && (await User.findById(seller._id)).violationCount === 1, r.body);
    check('a processed report cannot be resolved again', (await api.put(`/api/moderator/reports/${reportId}/resolve`).set(as(moderator)).send({ status: 'resolved', moderatorDecision: 'warn_user' })).status === 400);
    const Notification = req('src/modules/notifications/notification.model');
    check('reporter and reported user were notified', await Notification.countDocuments({ reportId, type: 'report_update' }) === 2);
    const second = (await api.post('/api/reports/product').set(as(target)).send({ productId: product._id, reason: 'scam', description: 'Tin đăng lừa đảo người mua' })).body.data._id;
    r = await api.put(`/api/reports/${second}/resolve`).set(as(moderator)).send({ status: 'resolved', moderatorDecision: 'remove_content', moderatorReply: 'Đã gỡ tin' });
    check('the report endpoint resolves through the same handler; remove_content removes the listing', r.status === 200 && (await Product.findById(product._id)).status === 'rejected', r.body);
    r = await api.post(`/api/moderator/users/${target._id}/ban`).set(as(moderator)).send({ reason: 'Bán hàng giả' });
    check('moderator restricts a user with a reason', r.status === 200 && (await User.findById(target._id)).isSellingRestricted === true, r.body);
    check('an admin cannot be sanctioned', (await api.post(`/api/moderator/users/${(await account('admin'))._id}/ban`).set(as(moderator)).send({ reason: 'x' })).status === 400);
  },

  async 'order-review-moderation'() {
    const moderator = await account('moderator');
    const paid = await orderAt('paid', 300000);
    const before = await balance(paid.buyer);
    let r = await api.get('/api/moderator/orders?status=paid').set(as(moderator));
    check('moderator lists paid orders', r.status === 200 && r.body.data.orders.some(item => String(item._id) === String(paid.order._id)), r.body);
    r = await api.get(`/api/moderator/orders/${paid.order._id}`).set(as(moderator));
    check('order detail lists the allowed next statuses', r.status === 200 && r.body.data.allowedNextStatuses.includes('cancelled'), r.body.data?.allowedNextStatuses);
    check('a jump outside the matrix is refused', (await api.patch(`/api/moderator/orders/${paid.order._id}/status`).set(as(moderator)).send({ nextStatus: 'completed' })).status === 400);
    check('cancellation needs a note', (await api.patch(`/api/moderator/orders/${paid.order._id}/status`).set(as(moderator)).send({ nextStatus: 'cancelled', note: 'ngắn' })).status === 400);
    r = await api.patch(`/api/moderator/orders/${paid.order._id}/status`).set(as(moderator)).send({ nextStatus: 'cancelled', note: 'Người bán yêu cầu hủy đơn' });
    check('moderator cancellation refunds escrow to the buyer', r.status === 200 && r.body.data.status === 'cancelled' && await balance(paid.buyer) === before + 300000, { status: r.body.data?.status, before, after: await balance(paid.buyer) });
    check('listing reopened after cancellation', (await Product.findById(paid.product._id)).status === 'active');
    const shipped = await orderAt('shipped', 200000);
    const sellerBefore = await balance(shipped.seller);
    r = await api.patch(`/api/moderator/orders/${shipped.order._id}/status`).set(as(moderator)).send({ nextStatus: 'completed' });
    check('moderator completion pays the seller minus the fee', r.status === 200 && r.body.data.status === 'completed' && await balance(shipped.seller) === sellerBefore + 190000, { sellerBefore, after: await balance(shipped.seller) });
    const forced = await orderAt('paid', 150000);
    const forcedBefore = await balance(forced.buyer);
    r = await api.post(`/api/moderator/orders/${forced.order._id}/force-cancel`).set(as(moderator)).send({ reason: 'Phát hiện giao dịch bất thường' });
    check('force-cancel refunds a paid order', r.status === 200 && await balance(forced.buyer) === forcedBefore + 150000, r.body);
    check('a completed order cannot be force-cancelled', (await api.post(`/api/moderator/orders/${shipped.order._id}/force-cancel`).set(as(moderator)).send({ reason: 'Không được phép hủy đơn này' })).status === 400);

    const done = await orderAt('completed');
    const low = (await api.post(`/api/reviews/orders/${done.order._id}/rate`).set(as(done.buyer)).send({ rating: 1, comment: 'Giao sai hàng' })).body.data;
    const done2 = await orderAt('completed');
    const high = (await api.post(`/api/reviews/orders/${done2.order._id}/rate`).set(as(done2.buyer)).send({ rating: 5 })).body.data;
    r = await api.get('/api/moderator/reviews?assessment=pending').set(as(moderator));
    check('only reviews below four stars wait for judgement', r.status === 200 && r.body.data.reviews.some(item => String(item._id) === String(low._id)) && !r.body.data.reviews.some(item => String(item._id) === String(high._id)), r.body);
    r = await api.patch(`/api/moderator/reviews/${low._id}/mark-bad`).set(as(moderator)).send({ note: 'Người bán giao sai hàng' });
    check('bad review counted against the seller', r.status === 200 && r.body.data.sellerPenalty.modBadReviewCount === 1, r.body);
    check('a review is judged once', (await api.patch(`/api/moderator/reviews/${low._id}/mark-good`).set(as(moderator)).send({})).status === 400);
    r = await api.patch(`/api/moderator/reviews/${high._id}/hide`).set(as(moderator));
    check('hiding a review recalculates the seller rating', r.status === 200 && (await User.findById(done2.seller._id)).totalReviews === 0, r.body);
  },

  async 'dispute-resolution'() {
    const moderator = await account('moderator');
    const open = async () => {
      const context = await orderAt('shipped', 200000);
      const evidence = await evidenceFile(context.buyer);
      const before = await balance(context.buyer);
      const dispute = (await api.post(`/api/orders/${context.order._id}/dispute`).set(as(context.buyer)).send({ reason: 'damaged', description: 'Hàng bị hỏng khi nhận', evidenceImages: [evidence] })).body.data;
      return { ...context, disputeId: dispute._id, before };
    };
    const refund = await open();
    check('moderator lists disputes', (await api.get('/api/moderator/disputes').set(as(moderator))).body.data?.disputes?.length >= 1);
    check('a pending dispute cannot be settled', (await api.put(`/api/moderator/disputes/${refund.disputeId}/resolve`).set(as(moderator)).send({ resolution: 'refund' })).status === 400);
    let r = await api.patch(`/api/moderator/disputes/${refund.disputeId}/investigating`).set(as(moderator)).send({});
    check('moderator starts the investigation', r.status === 200 && r.body.data.status === 'investigating', r.body);
    check('moderator posts in the conversation', (await api.post(`/api/moderator/disputes/${refund.disputeId}/message`).set(as(moderator)).send({ content: 'Hai bên bổ sung bằng chứng' })).status === 200);
    check('an unknown resolution is rejected', (await api.put(`/api/moderator/disputes/${refund.disputeId}/resolve`).set(as(moderator)).send({ resolution: 'split' })).status === 400);
    r = await api.put(`/api/moderator/disputes/${refund.disputeId}/resolve`).set(as(moderator)).send({ resolution: 'refund', moderatorNotes: 'Hàng lỗi' });
    check('refund resolves the dispute', r.status === 200 && r.body.data.status === 'resolved', r.body);
    check('buyer refunded in full', await balance(refund.buyer) === refund.before + 200000, { before: refund.before, after: await balance(refund.buyer) });
    check('order cancelled and listing reopened', (await Order.findById(refund.order._id)).status === 'cancelled' && (await Product.findById(refund.product._id)).status === 'active');
    check('seller records a dispute violation', (await User.findById(refund.seller._id)).violationCount === 1);
    check('a resolved dispute cannot be resolved again', (await api.put(`/api/moderator/disputes/${refund.disputeId}/resolve`).set(as(moderator)).send({ resolution: 'release' })).status === 400);

    const release = await open();
    const sellerBefore = await balance(release.seller);
    await api.patch(`/api/moderator/disputes/${release.disputeId}/investigating`).set(as(moderator)).send({});
    r = await api.put(`/api/moderator/disputes/${release.disputeId}/resolve`).set(as(moderator)).send({ resolution: 'release' });
    check('release pays the seller minus the fee', r.status === 200 && await balance(release.seller) === sellerBefore + 190000, { sellerBefore, after: await balance(release.seller) });
    check('order completed and listing sold', (await Order.findById(release.order._id)).status === 'completed' && (await Product.findById(release.product._id)).status === 'sold');
    check('buyer records a dispute violation', (await User.findById(release.buyer._id)).violationCount === 1);
    await User.updateOne({ _id: refund.seller._id }, { violationCount: 2 });
    const third = await open();
    await Dispute.updateOne({ _id: third.disputeId }, { sellerId: refund.seller._id });
    await api.patch(`/api/moderator/disputes/${third.disputeId}/investigating`).set(as(moderator)).send({});
    await api.put(`/api/moderator/disputes/${third.disputeId}/resolve`).set(as(moderator)).send({ resolution: 'refund' });
    const restricted = await User.findById(refund.seller._id);
    const days = (restricted.sellingRestrictedUntil - Date.now()) / 86400000;
    check('third dispute violation restricts selling for 30 days', restricted.isSellingRestricted === true && days > 29.9 && days <= 30, { days });
  },

  async withdrawals() {
    const moderator = await account('moderator');
    const admin = await account('admin');
    const seller = await account('user', 300000);
    const form = { amount: 50000, bankAccount: '123456789', bankName: 'VCB', accountHolder: 'NGUYEN VAN A' };
    let r = await api.post('/api/wallets/withdraw').set(as(seller)).send(form);
    check('seller requests a withdrawal', [200, 201].includes(r.status), r.body);
    r = await api.get('/api/moderator/withdrawals?status=pending').set(as(moderator));
    const first = r.body.data?.withdrawals?.find(item => String(item.userId?._id || item.userId) === String(seller._id));
    check('moderator sees the pending request', Boolean(first), r.body);
    r = await api.patch(`/api/moderator/withdrawals/${first._id}/status`).set(as(moderator)).send({ status: 'completed' });
    check('moderator approval completes the request', r.status === 200 && r.body.data.status === 'completed' && r.body.data.balanceAfter === 250000, r.body);
    check('wallet debited exactly once', await balance(seller) === 250000);
    check('a processed request cannot be approved again', (await api.patch(`/api/moderator/withdrawals/${first._id}/status`).set(as(moderator)).send({ status: 'completed' })).status === 400);
    check('wallet unchanged by the refused approval', await balance(seller) === 250000);
    await api.post('/api/wallets/withdraw').set(as(seller)).send(form);
    r = await api.get('/api/wallets/admin/withdrawals').set(as(admin));
    const second = r.body.data?.withdrawals?.find(item => String(item.userId?._id || item.userId) === String(seller._id));
    check('admin sees the same pending queue', Boolean(second), r.body);
    r = await api.post(`/api/wallets/admin/withdrawals/${second._id}/reject`).set(as(admin)).send({ reason: 'Sai số tài khoản' });
    check('admin rejection records the reason without a debit', r.status === 200 && r.body.data.status === 'cancelled' && r.body.data.failureReason === 'Sai số tài khoản' && await balance(seller) === 250000, r.body);
    check('a rejected request cannot be approved', (await api.post(`/api/wallets/admin/withdrawals/${second._id}/approve`).set(as(admin))).status === 400);
    await api.post('/api/wallets/withdraw').set(as(seller)).send({ ...form, amount: 250000 });
    await walletService.decrementBalance(seller._id, 100000, 'payment', 'integration');
    r = await api.get('/api/moderator/withdrawals?status=pending').set(as(moderator));
    const third = r.body.data.withdrawals.find(item => String(item.userId?._id || item.userId) === String(seller._id));
    check('approval beyond the balance is refused and debits nothing', (await api.patch(`/api/moderator/withdrawals/${third._id}/status`).set(as(moderator)).send({ status: 'completed' })).status === 400 && await balance(seller) === 150000);
    check('users cannot process withdrawals', (await api.patch(`/api/moderator/withdrawals/${third._id}/status`).set(as(seller)).send({ status: 'completed' })).status === 403);
  },

  async jobs() {
    const jobs = req('src/services/order-jobs.service');
    const unpaid = await orderAt('awaiting_payment');
    check('an order inside its payment window is left alone', (await jobs.cancelUnpaidOrders()) === 0 && (await Order.findById(unpaid.order._id)).status === 'awaiting_payment');
    await Order.updateOne({ _id: unpaid.order._id }, { paymentDeadline: new Date(Date.now() - 1000) });
    check('payment timeout cancels the order', (await jobs.cancelUnpaidOrders()) === 1 && (await Order.findById(unpaid.order._id)).status === 'cancelled');
    check('listing returned to active', (await Product.findById(unpaid.product._id)).status === 'active');
    const late = await orderAt('paid', 120000);
    const lateBefore = await balance(late.buyer);
    check('a recently paid order is not refunded', (await jobs.refundUnshippedOrders()) === 0);
    await Order.updateOne({ _id: late.order._id }, { paidAt: new Date(Date.now() - 25 * 3600 * 1000) });
    check('late shipping refunds and cancels the order', (await jobs.refundUnshippedOrders()) === 1 && await balance(late.buyer) === lateBefore + 120000 && (await Order.findById(late.order._id)).status === 'cancelled');
    const delivered = await orderAt('delivered', 100000);
    const sellerBefore = await balance(delivered.seller);
    check('a recently delivered order is not completed', (await jobs.completeDeliveredOrders()) === 0);
    await Order.updateOne({ _id: delivered.order._id }, { deliveredAt: new Date(Date.now() - 6 * 24 * 3600 * 1000) });
    check('delivered order completes and pays the seller once', (await jobs.completeDeliveredOrders()) === 1 && await balance(delivered.seller) === sellerBefore + 95000 && (await Order.findById(delivered.order._id)).status === 'completed');
    check('a second run releases nothing', (await jobs.completeDeliveredOrders()) === 0 && await balance(delivered.seller) === sellerBefore + 95000);
    const disputed = await orderAt('delivered');
    const evidence = await evidenceFile(disputed.buyer);
    await api.post(`/api/orders/${disputed.order._id}/dispute`).set(as(disputed.buyer)).send({ reason: 'damaged', description: 'Hàng bị hỏng khi nhận', evidenceImages: [evidence] });
    await Order.updateOne({ _id: disputed.order._id }, { deliveredAt: new Date(Date.now() - 6 * 24 * 3600 * 1000) });
    check('a disputed order is never completed automatically', (await jobs.completeDeliveredOrders()) === 0 && (await Order.findById(disputed.order._id)).status === 'disputed');
  },

  async 'abandoned-checkout'() {
    const jobs = req('src/services/order-jobs.service');
    const service = req('src/modules/orders/abandoned-checkout.service');
    const CartItem = req('src/modules/users/cart-item.model');
    const AbandonedCheckout = req('src/modules/orders/abandoned-checkout.model');
    await AbandonedCheckout.deleteMany({});
    const moderator = await account('moderator');
    const { seller, buyer, product, order } = await orderAt('awaiting_payment', 150000);
    const other = await account();
    check('an order far from its deadline is not reminded', (await service.remindExpiringPayments()) === 0);
    await Order.updateOne({ _id: order._id }, { paymentDeadline: new Date(Date.now() + 30000) });
    check('one reminder inside the lead time', (await service.remindExpiringPayments()) === 1 && (await service.remindExpiringPayments()) === 0);
    let r = await api.get('/api/abandoned-checkouts').set(as(buyer));
    check('buyer can resume the payment', r.status === 200 && r.body.data.length === 1 && r.body.data[0].action === 'resume_payment' && String(r.body.data[0].orderId) === String(order._id), r.body);
    check('another buyer sees nothing', (await api.get('/api/abandoned-checkouts').set(as(other))).body.data.length === 0);
    await Order.updateOne({ _id: order._id }, { paymentDeadline: new Date(Date.now() - 1000) });
    check('payment timeout cancels the order', (await jobs.cancelUnpaidOrders()) === 1);
    r = await api.get('/api/abandoned-checkouts').set(as(buyer));
    check('the checkout is open with a buy-again offer', r.body.data.length === 1 && r.body.data[0].action === 'buy_again' && r.body.data[0].status === 'open', r.body);
    const checkoutId = r.body.data[0]._id;
    check('another buyer cannot dismiss it', (await api.post(`/api/abandoned-checkouts/${checkoutId}/dismiss`).set(as(other))).status === 404);
    const titles = JSON.stringify((await api.get('/api/notifications').set(as(buyer))).body).match(/Đơn hàng sắp hết hạn thanh toán|Thanh toán chưa hoàn tất/g) || [];
    check('buyer received the reminder and the abandonment notice', titles.length === 2, titles);
    const again = await quickBuy(buyer, product);
    await api.post(`/api/orders/${again.order._id}/pay`).set(as(buyer));
    check('buying again marks the checkout recovered', (await service.reconcile()).recovered === 1 && (await api.get('/api/abandoned-checkouts').set(as(buyer))).body.data.length === 0);

    const cartProduct = (await listing(seller, 90000)).body.data;
    r = await api.post('/api/cart').set(as(other)).send({ productId: cartProduct._id });
    check('item added to the cart', [200, 201].includes(r.status), r.body);
    check('a fresh cart item is not abandoned', (await service.detectAbandonedCarts()) === 0);
    await CartItem.updateOne({ user: other._id, product: cartProduct._id }, { createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000) });
    check('an old cart item is reminded once', (await service.detectAbandonedCarts()) === 1 && (await service.detectAbandonedCarts()) === 0);
    r = await api.get('/api/abandoned-checkouts').set(as(other));
    check('cart checkout listed for its owner', r.body.data.length === 1 && r.body.data[0].source === 'cart', r.body);
    r = await api.post(`/api/abandoned-checkouts/${r.body.data[0]._id}/dismiss`).set(as(other));
    check('owner dismisses it', r.status === 200 && r.body.data.status === 'dismissed', r.body);
    const third = await account();
    await api.post('/api/cart').set(as(third)).send({ productId: cartProduct._id });
    await CartItem.updateOne({ user: third._id, product: cartProduct._id }, { createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000) });
    await service.detectAbandonedCarts();
    await api.delete(`/api/cart/${cartProduct._id}`).set(as(third));
    check('removing the cart item expires the checkout', (await service.reconcile()).expired === 1);
    check('summary is staff only', (await api.get('/api/abandoned-checkouts/summary').set(as(buyer))).status === 403);
    r = await api.get('/api/abandoned-checkouts/summary').set(as(moderator));
    check('summary reports recovery by source', r.status === 200 && r.body.data.total === 3 && r.body.data.recovered === 1 && r.body.data.lost === 2 && r.body.data.recoveryRate === 33.3 && r.body.data.recoveredAmount === 150000 && r.body.data.bySource.cart.total === 2, r.body.data);
    check('staff list filtered by status', (await api.get('/api/abandoned-checkouts/all?status=recovered').set(as(moderator))).body.data?.checkouts?.length === 1);
  },

  async 'listing-expiry'() {
    const jobs = req('src/services/order-jobs.service');
    const seller = await account();
    const old = (await listing(seller, 50000)).body.data;
    const fresh = (await listing(seller, 60000)).body.data;
    const reserved = await orderAt('awaiting_payment');
    const stale = new Date(Date.now() - 40 * 24 * 3600 * 1000);
    await Product.updateMany({ _id: { $in: [old._id, reserved.product._id] } }, { createdAt: stale });
    const expired = await jobs.expireOldListings();
    check('a listing past the maximum age is soft-expired', expired >= 1 && (await Product.findById(old._id)).status === 'expired');
    check('the document is kept', Boolean(await Product.findById(old._id)));
    check('a recent listing stays active', (await Product.findById(fresh._id)).status === 'active');
    check('a listing reserved by an open order is not expired', (await Product.findById(reserved.product._id)).status !== 'expired');
    check('an expired listing leaves the public catalog', (await api.get(`/api/products/${old._id}`)).status === 404);
  }
};

async function main() {
  const unknown = wanted.filter(name => !sections[name]);
  if (unknown.length || !wanted.length) throw new Error(`unknown or missing sections: ${unknown.join(', ')} (available: ${Object.keys(sections).join(', ')})`);
  await mongoose.connect(process.env.MONGODB_URI);
  await mongoose.connection.dropDatabase();
  for (const file of ['src/modules/users/cart-item.model', 'src/modules/users/favorite.model', 'src/modules/reports/review.model', 'src/modules/reports/report.model', 'src/modules/payments/escrow-hold.model', 'src/modules/payments/transaction.model', 'src/modules/payments/wallet.model', 'src/modules/notifications/notification.model', 'src/modules/delivery/delivery.model', 'src/modules/orders/purchase-request.model', 'src/modules/orders/abandoned-checkout.model']) optional(file);
  for (const name of mongoose.modelNames()) await mongoose.model(name).createCollection().catch(() => {});
  await Promise.all(mongoose.modelNames().map(name => mongoose.model(name).syncIndexes()));
  await Category.create({ name: 'Sách', slug: 'sach', isActive: true });
  console.log(`MongoDB ${(await mongoose.connection.db.admin().serverInfo()).version}; sections: ${wanted.join(', ')}`);
  for (const name of wanted) {
    console.log(`# ${name}`);
    await sections[name]();
  }
}

main()
  .catch(error => { failures += 1; console.log(`CRASH ${error.stack || error}`); })
  .finally(async () => {
    for (const file of uploaded.filter(Boolean)) fs.rmSync(path.join(B, file), { force: true });
    for (const dir of ['uploads/products/temp', 'uploads/evidence/temp']) {
      const full = path.join(B, dir);
      if (fs.existsSync(full) && !fs.readdirSync(full).length) fs.rmdirSync(full);
    }
    await mongoose.connection.dropDatabase().catch(() => {});
    await mongoose.disconnect();
    console.log(`\n${checks} checks, ${failures} failed`);
    process.exit(failures ? 1 : 0);
  });
