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
const staffNotes = [
  { _id: 'n1', type: 'report_update', title: 'Báo cáo mới cần xử lý', message: 'Có báo cáo sản phẩm giả mạo đang chờ kiểm duyệt.', isRead: false, createdAt: iso(10) },
  { _id: 'n2', type: 'dispute_created', title: 'Tranh chấp mới', message: 'Đơn SS-10024 vừa được mở tranh chấp.', isRead: false, createdAt: iso(45) },
  { _id: 'n3', type: 'system', title: 'Yêu cầu rút tiền', message: 'Có 2 yêu cầu rút tiền đang chờ duyệt.', isRead: true, createdAt: iso(300) },
  { _id: 'n4', type: 'security', title: 'Đăng nhập mới', message: 'Tài khoản vừa đăng nhập từ một thiết bị mới.', isRead: true, createdAt: iso(1500) },
];
const seller = { _id: 's1', fullName: 'Demo' };
const buyer = { _id: 'b1', fullName: 'Trần Thị B' };
const mkOrder = (id, status, title, price) => ({ _id: id, status, agreedPrice: price, createdAt: iso(600), productId: { title, images: [] }, buyerId: buyer, sellerId: seller });
const sellerOrders = [
  mkOrder('o1', 'paid', 'iPhone 13 Pro 128GB còn bảo hành', 12500000),
  mkOrder('o2', 'awaiting_seller_confirmation', 'Giày Nike Air Force 1 size 42', 890000),
  mkOrder('o3', 'shipped', 'Bàn học gỗ sồi', 1500000),
  mkOrder('o4', 'completed', 'Áo khoác denim Levis', 450000),
];
const role = process.argv[3] || 'moderator';
function body(u) {
  if (u.includes('/auth/profile')) return { _id: 'u1', fullName: 'Demo', role, email: 'demo@example.com' };
  if (u.includes('/notifications/unread-count')) return { count: 2, unreadCount: 2 };
  if (u.includes('/notifications')) return { notifications: staffNotes, pagination: { page: 1, totalPages: 1 }, unreadCount: 2 };
  if (u.includes('/orders/selling') || u.includes('/orders/seller')) return { orders: sellerOrders, total: 4, page: 1, totalPages: 1 };
  return [];
}
server.listen(4179, async () => {
  const b = await chromium.launch();
  for (const [label, width, height] of [['w1280', 1280, 800], ['w390', 390, 800]]) {
    const ctx = await b.newContext({ viewport: { width, height } }); const page = await ctx.newPage();
    const errs = []; page.on('pageerror', (e) => errs.push(String(e.message).slice(0, 120)));
    const asRole = process.argv[3] || 'moderator';
    await page.addInitScript((r) => { localStorage.setItem('token', 'x.' + btoa(JSON.stringify({ userId: 'u1' })) + '.y'); localStorage.setItem('secondsafe:role', r); localStorage.setItem('user', JSON.stringify({ role: r, _id: 'u1', fullName: 'Demo' })); }, asRole);
    const urls = [];
    await page.route('http://localhost:5000/**', (route) => {
      urls.push(route.request().url());
      const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ success: true, data: body(route.request().url()) }) });
    });
    await page.goto('http://localhost:4179/', { waitUntil: 'networkidle' }).catch(() => {}); await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Thông báo/ }).click(); await page.waitForTimeout(700);
    await page.screenshot({ path: `${OUT}/${label}-staff-notifications.png` });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    console.log(label, 'staff-panel overflow:', overflow, 'errors:', errs.slice(0, 2));
    await ctx.close();
  }
  for (const [label, width, height] of [['w1280', 1280, 800], ['w390', 390, 800]]) {
    const ctx = await b.newContext({ viewport: { width, height } }); const page = await ctx.newPage();
    await page.addInitScript(() => { localStorage.setItem('token', 'x.' + btoa(JSON.stringify({ userId: 'u1' })) + '.y'); localStorage.setItem('secondsafe:role', 'user'); localStorage.setItem('user', JSON.stringify({ role: 'user', _id: 'u1', fullName: 'Demo' })); });
    await page.route('http://localhost:5000/**', (route) => {
      const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      const u = route.request().url();
      const data = u.includes('/auth/profile') ? { _id: 'u1', fullName: 'Demo', role: 'user', email: 'demo@example.com' } : u.includes('unread-count') ? { count: 0, unreadCount: 0 } : (u.includes('/orders') ? { orders: sellerOrders, total: 4, page: 1, totalPages: 1 } : []);
      return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ success: true, data }) });
    });
    await page.goto('http://localhost:4179/seller-orders', { waitUntil: 'networkidle' }).catch(() => {}); await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/${label}-seller-orders-default.png` });
    const active = await page.locator('.filter-btn.active').allTextContents();
    const cards = await page.locator('.order-card').count();
    await page.locator('.filter-btn').nth(1).click(); await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/${label}-seller-orders-shipping.png` });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    console.log(label, 'seller-orders active tabs:', active.map((s) => s.trim()), 'cards on open:', cards, 'overflow:', overflow);
    await ctx.close();
  }
  await b.close(); server.close();
});
