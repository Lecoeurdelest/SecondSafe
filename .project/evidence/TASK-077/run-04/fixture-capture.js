const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const BUILD = '/home/user/secondsafe/frontend/build';
const OUT = process.argv[2];
const server = http.createServer((req, res) => {
  let file = path.join(BUILD, req.url.split('?')[0]);
  if (!file.startsWith(BUILD) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(BUILD, 'index.html');
  res.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' }[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
const iso = (m) => new Date(Date.now() - m * 60000).toISOString();
const me = { _id: 'u1', fullName: 'Demo' }, seller = { _id: 's1', fullName: 'Nguyễn Văn A' };
const product = { _id: 'p0', title: 'iPhone 13 Pro 128GB còn bảo hành', price: 12500000, images: [] };
const conv = { _id: 'c1', buyerId: me, sellerId: seller, productId: product, lastMessage: 'Máy còn không bạn?', buyerUnreadCount: 2, sellerUnreadCount: 0, updatedAt: iso(5) };
const messages = [
  { _id: 'm1', senderId: me, type: 'text', content: 'Chào bạn, máy còn không?', createdAt: iso(30), metadata: {} },
  { _id: 'm2', senderId: seller, type: 'text', content: 'Còn nhé bạn, pin 92%, đủ phụ kiện.', createdAt: iso(25), metadata: {} },
  { _id: 'm3', senderId: me, type: 'text', content: 'Mình lấy giá 12 triệu được không?', createdAt: iso(10), metadata: {} },
];
const orders = [
  { _id: 'o1', orderCode: 'SS-10024', status: 'pending', agreedPrice: 12500000, totalAmount: 12650000, createdAt: iso(300), listing: product, seller, buyer: me },
  { _id: 'o2', orderCode: 'SS-10019', status: 'shipped', agreedPrice: 890000, totalAmount: 940000, createdAt: iso(3000), shippedAt: iso(1500), listing: { ...product, title: 'Giày Nike Air Force 1 size 42' }, seller, buyer: me },
  { _id: 'o3', orderCode: 'SS-10011', status: 'completed', agreedPrice: 450000, totalAmount: 480000, createdAt: iso(9000), listing: { ...product, title: 'Áo khoác denim Levis' }, seller, buyer: me },
];
const txs = [
  { _id: 't1', type: 'topup', status: 'completed', amount: 2000000, description: 'Nạp tiền vào ví', metadata: {}, createdAt: iso(200) },
  { _id: 't2', type: 'payment', status: 'completed', amount: -890000, description: 'Thanh toán đơn SS-10019', metadata: {}, createdAt: iso(3000) },
  { _id: 't3', type: 'withdrawal', status: 'pending', amount: -500000, description: 'Yêu cầu rút tiền', metadata: {}, createdAt: iso(4000) },
];
const notes = [
  { _id: 'n1', type: 'order', title: 'Đơn hàng đã được gửi', message: 'Người bán đã gửi đơn SS-10019.', isRead: false, createdAt: iso(20) },
  { _id: 'n2', type: 'message', title: 'Tin nhắn mới', message: 'Nguyễn Văn A: Còn nhé bạn, pin 92%.', isRead: false, createdAt: iso(60) },
  { _id: 'n3', type: 'wallet', title: 'Nạp tiền thành công', message: 'Ví của bạn đã được cộng 2.000.000 ₫.', isRead: true, createdAt: iso(400) },
];
function body(u) {
  if (u.includes('/auth/profile')) return { ...me, role: 'user', email: 'demo@example.com' };
  if (/\/chat\/conversations\/c1\/messages/.test(u)) return { messages, total: 3, page: 1, totalPages: 1 };
  if (/\/chat\/conversations\/c1/.test(u)) return conv;
  if (u.includes('/chat/conversations')) return { conversations: [conv, { ...conv, _id: 'c2', lastMessage: 'Mình lấy nhé', buyerUnreadCount: 0, productId: { ...product, title: 'Bàn học gỗ sồi' } }], total: 2 };
  if (u.includes('/orders/buying')) return { orders, total: 3, page: 1, totalPages: 1 };
  if (u.includes('/wallets/balance')) return { balance: 1250000, availableBalance: 1250000, pendingBalance: 500000, totalTopup: 2000000, totalWithdrawn: 0, totalSpent: 890000, totalEarned: 0 };
  if (u.includes('/wallets/transactions')) return { transactions: txs, total: 3, page: 1, totalPages: 1 };
  if (u.includes('/notifications/unread-count')) return { count: 2, unreadCount: 2 };
  if (u.includes('/notifications')) return { notifications: notes, total: 3, page: 1, totalPages: 1, unreadCount: 2 };
  return [];
}
server.listen(4175, async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }); const page = await ctx.newPage();
  await page.addInitScript(() => { localStorage.setItem('token', 'x.' + btoa(JSON.stringify({ userId: 'u1' })) + '.y'); localStorage.setItem('secondsafe:role', 'user'); localStorage.setItem('user', JSON.stringify({ role: 'user', _id: 'u1', fullName: 'Demo' })); });
  await page.route('http://localhost:5000/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ success: true, data: body(route.request().url()) }) }));
  for (const [name, url, action] of [['orders-data', '/orders'], ['wallet-data', '/wallet'], ['chat-thread', '/chat/c1'], ['notifications-open', '/', 'notif']]) {
    const errs = []; const h = (e) => errs.push(String(e.message).slice(0, 120)); page.on('pageerror', h);
    await page.goto('http://localhost:4175' + url, { waitUntil: 'networkidle' }).catch(() => {}); await page.waitForTimeout(600);
    if (action === 'notif') { await page.getByRole('button', { name: /Thông báo/ }).click(); await page.waitForTimeout(600); }
    await page.screenshot({ path: `${OUT}/w1280-${name}.png` }); console.log(name, 'errors:', errs.slice(0, 2)); page.off('pageerror', h);
  }
  await b.close(); server.close();
});
