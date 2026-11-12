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
const swatch = (i) => `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="${['#fde68a', '#bfdbfe', '#fbcfe8'][i % 3]}"/></svg>`;
const d = (n) => new Date(Date.now() - n * 86400000).toISOString();
const order = (i, status, extra = {}) => ({
  _id: `order${i}`.padEnd(24, '0'), orderCode: `SS${1000 + i}`, status, agreedPrice: 450000 + i * 50000, totalAmount: 480000 + i * 50000, createdAt: d(i),
  listing: { title: ['Balo laptop chống nước', 'Sách Đắc nhân tâm bản đẹp', 'iPhone 13 Pro 128GB còn bảo hành', 'Đèn bàn LED cảm ứng'][i % 4], images: [`http://localhost:5000/uploads/a${i}.svg`] },
  seller: { fullName: 'Trần Thị Bích' }, buyer: { fullName: 'Nguyễn Văn An' }, ...extra
});
const BUYING = [order(0, 'awaiting_payment'), order(1, 'paid'), order(2, 'delivered', { shippedAt: d(1) }), order(3, 'completed')];
const SELLING = [order(4, 'awaiting_seller_confirmation'), order(5, 'paid'), order(6, 'shipped', { shippedAt: d(1) }), order(7, 'disputed')];
const SELLER_PAGE = [
  { _id: 'x1', status: 'paid', agreedPrice: 450000, createdAt: d(1), productId: { title: 'Balo laptop chống nước', images: ['http://localhost:5000/uploads/a0.svg'] }, buyerId: { fullName: 'Nguyễn Văn An' } },
  { _id: 'x2', status: 'awaiting_payment', agreedPrice: 250000, createdAt: d(2), productId: { title: 'Sách Đắc nhân tâm bản đẹp', images: ['http://localhost:5000/uploads/a1.svg'] }, buyerId: { username: 'khach42' } },
  { _id: 'x3', status: 'shipped', agreedPrice: 12500000, createdAt: d(4), productId: { title: 'iPhone 13 Pro 128GB còn bảo hành', images: ['http://localhost:5000/uploads/a2.svg'] }, buyerId: { fullName: 'Lê Thị Cúc' } }
];
const CHECKOUTS = [
  { _id: 'c1', source: 'order', status: 'at_risk', action: 'resume_payment', amount: 450000, orderId: 'order0', paymentDeadline: new Date(Date.now() + 3600000).toISOString(), product: { _id: 'p1', title: 'Balo laptop chống nước', images: ['http://localhost:5000/uploads/a0.svg'] } },
  { _id: 'c2', source: 'cart', status: 'open', action: 'buy_again', amount: 70000, orderId: null, product: { _id: 'p2', title: 'Đèn bàn LED cảm ứng', images: ['http://localhost:5000/uploads/a1.svg'] } }
];
(async () => {
  await new Promise((r) => server.listen(4195, r));
  const b = await chromium.launch();
  const rows = [];
  for (const theme of ['light', 'dark']) for (const [label, width, height] of [['w1280', 1280, 900], ['w390', 390, 844]]) {
    const ctx = await b.newContext({ viewport: { width, height }, colorScheme: theme });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', (e) => errs.push(String(e.message).slice(0, 100)));
    await page.addInitScript(([th]) => {
      localStorage.setItem('secondsafe:theme', th);
      localStorage.setItem('token', 'x.' + btoa(JSON.stringify({ userId: 'u1' })) + '.y'); localStorage.setItem('secondsafe:role', 'user');
      localStorage.setItem('user', JSON.stringify({ role: 'user', _id: 'u1', fullName: 'Nguyễn Văn An' }));
    }, [theme]);
    await page.route('http://localhost:5000/**', (route) => {
      const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
      const u = route.request().url(); const method = route.request().method();
      if (method === 'OPTIONS') return route.fulfill({ status: 204, headers });
      const json = (data) => route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ success: true, data }) });
      if (u.includes('/uploads/')) return route.fulfill({ status: 200, contentType: 'image/svg+xml', headers, body: swatch(Number((u.match(/(\d+)\.svg/) || [0, 0])[1])) });
      if (u.includes('/auth/profile')) return json({ _id: 'u1', fullName: 'Nguyễn Văn An', role: 'user' });
      if (u.includes('/orders/buying')) return json({ orders: BUYING, currentPage: 1, totalPages: 2, totalOrders: 14 });
      if (u.includes('/orders/selling')) return route.request().headers()['referer']?.includes('seller-orders') || u.includes('limit') === false ? json({ orders: SELLER_PAGE }) : json({ orders: SELLING, currentPage: 1, totalPages: 1, totalOrders: 4 });
      if (u.includes('/abandoned-checkouts')) return json(CHECKOUTS);
      if (u.includes('/cart')) return json({ items: [], page: 1, totalPages: 0, total: 0, limit: 20 });
      return json([]);
    });
    const shot = (name, full) => page.screenshot({ path: `${OUT}/${theme}-${label}-${name}.png`, fullPage: !!full });
    const overflow = async () => await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    const row = { theme, label };
    await page.goto('http://localhost:4195/orders', { waitUntil: 'load' }); await page.waitForTimeout(1800);
    row.buyingCards = await page.locator('.order-item').count();
    row.abandonedItems = await page.locator('.abandoned-checkouts__item').count();
    row.ordersOverflow = await overflow();
    await shot('orders-buying', true);
    await page.getByRole('tab', { name: /Đơn bán/ }).click(); await page.waitForTimeout(1200);
    row.sellingCards = await page.locator('.order-item').count();
    await shot('orders-selling', true);
    await page.getByRole('tab', { name: /Đơn mua/ }).click(); await page.waitForTimeout(1000);
    await page.getByRole('button', { name: /Hủy đơn/ }).first().click(); await page.waitForTimeout(600);
    row.cancelDialog = await page.getByRole('dialog').count();
    await page.getByRole('textbox', { name: 'Nhập lý do hủy đơn hàng của bạn:' }).fill('Tôi tìm được món rẻ hơn.'); await page.waitForTimeout(300);
    await shot('orders-cancel');
    await page.getByRole('button', { name: 'Giữ đơn hàng' }).click(); await page.waitForTimeout(500);
    await page.goto('http://localhost:4195/seller-orders', { waitUntil: 'load' }); await page.waitForTimeout(1800);
    row.sellerCards = await page.locator('.seller-order-item').count();
    row.sellerOverflow = await overflow();
    await shot('seller-orders', true);
    await page.goto('http://localhost:4195/cart', { waitUntil: 'load' }); await page.waitForTimeout(1500);
    row.cartOverflow = await overflow();
    await shot('abandoned', false);
    row.errors = errs.length;
    rows.push(row);
    await ctx.close();
  }
  console.log(rows.map((r) => JSON.stringify(r)).join('\n'));
  await b.close(); server.close();
})();
