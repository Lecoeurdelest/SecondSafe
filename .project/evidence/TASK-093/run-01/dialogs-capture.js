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
const ID = 'order1'.padEnd(24, '0');
const BASE = { _id: ID, orderCode: 'SS1001', agreedPrice: 12500000, totalAmount: 12550000, createdAt: d(5),
  listing: { _id: 'p0', title: 'iPhone 13 Pro 128GB còn bảo hành', condition: 'good', images: ['http://localhost:5000/uploads/a0.svg'], specificAddress: '12 Trần Duy Hưng', location: { city: 'Hà Nội', district: 'Cầu Giấy', ward: 'Trung Hòa' } },
  seller: { _id: 's1', fullName: 'Trần Thị Bích', email: 'bich@example.com' }, buyer: { _id: 'u1', fullName: 'Nguyễn Văn An', phone: '0912345678', address: '25 Lê Lợi, Quận 1, TP HCM' } };
const SELLING_PAID = { ...BASE, status: 'paid' };
const DELIVERED = { ...BASE, status: 'delivered', shippedAt: d(2), shipping: { provider: 'ghn', trackingNumber: 'GHN-SS1001-AB12CD' } };
(async () => {
  await new Promise((r) => server.listen(4197, r));
  const b = await chromium.launch();
  const rows = [];
  for (const theme of ['light', 'dark']) for (const [label, width, height] of [['w1280', 1280, 900], ['w390', 390, 844]]) {
    const ctx = await b.newContext({ viewport: { width, height }, colorScheme: theme });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', (e) => errs.push(String(e.message).slice(0, 100)));
    await page.addInitScript(([th]) => {
      localStorage.setItem('secondsafe:theme', th);
      localStorage.setItem('token', 'x.' + btoa(JSON.stringify({ userId: 'u1' })) + '.y'); localStorage.setItem('secondsafe:role', 'user');
      localStorage.setItem('user', JSON.stringify({ role: 'user', _id: 'u1', fullName: 'Trần Thị Bích', phone: '0987654321' }));
    }, [theme]);
    await page.route('http://localhost:5000/**', (route) => {
      const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
      const u = route.request().url(); const method = route.request().method();
      if (method === 'OPTIONS') return route.fulfill({ status: 204, headers });
      const json = (data) => route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ success: true, data }) });
      if (u.includes('/uploads/')) return route.fulfill({ status: 200, contentType: 'image/svg+xml', headers, body: swatch(Number((u.match(/(\d+)\.svg/) || [0, 0])[1])) });
      if (u.includes('/auth/profile')) return json({ _id: 'u1', fullName: 'Trần Thị Bích', phone: '0987654321', role: 'user' });
      if (u.includes('/orders/selling')) return json({ orders: [SELLING_PAID], currentPage: 1, totalPages: 1, totalOrders: 1 });
      if (u.includes('/orders/buying')) return json({ orders: [], currentPage: 1, totalPages: 1, totalOrders: 0 });
      if (u.includes(`/orders/${ID}`)) return json({ ...DELIVERED, status: 'shipped', buyer: { ...DELIVERED.buyer, _id: 'u1' } });
      if (u.includes('/abandoned-checkouts')) return json([]);
      return json([]);
    });
    const shot = (name, full) => page.screenshot({ path: `${OUT}/${theme}-${label}-${name}.png`, fullPage: !!full });
    const overflow = async () => await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    const row = { theme, label };
    await page.goto('http://localhost:4197/orders', { waitUntil: 'load' }); await page.waitForTimeout(1500);
    await page.getByRole('tab', { name: /Đơn bán/ }).click(); await page.waitForTimeout(1200);
    await page.getByRole('button', { name: 'Xác nhận giao hàng' }).click(); await page.waitForTimeout(800);
    row.shipDialog = await page.getByText('Xác nhận giao hàng', { exact: true }).count();
    row.shipOverflow = await overflow();
    await page.locator('.ant-modal-wrap').first().evaluate((el) => { el.scrollTop = 0; });
    await shot('ship-top');
    await page.locator('.ant-modal-wrap').first().evaluate((el) => { el.scrollTop = el.scrollHeight; });
    await page.waitForTimeout(300);
    await shot('ship-bottom');
    await page.getByRole('checkbox', { name: 'Tùy chỉnh điểm lấy hàng' }).check(); await page.waitForTimeout(500);
    await page.locator('.ant-modal-wrap').first().evaluate((el) => { el.scrollTop = el.scrollHeight / 3; });
    await page.waitForTimeout(300);
    await shot('ship-custom');
    await page.goto(`http://localhost:4197/orders/${ID}?action=confirm-receipt`, { waitUntil: 'load' }); await page.waitForTimeout(2000);
    row.receiptDialog = await page.getByRole('button', { name: 'Xác nhận nhận hàng' }).count();
    if (row.receiptDialog) {
      await page.getByRole('button', { name: 'Đúng mô tả' }).click(); await page.getByRole('button', { name: 'Giao hàng nhanh' }).click();
      await page.getByRole('textbox', { name: /Nhận xét chi tiết/ }).fill('Máy đúng như mô tả, người bán giao nhanh.');
      await page.locator('.ant-modal-wrap').first().evaluate((el) => { el.scrollTop = 0; }); await page.waitForTimeout(300);
      await shot('receipt-top');
      await page.locator('.ant-modal-wrap').first().evaluate((el) => { el.scrollTop = el.scrollHeight; }); await page.waitForTimeout(300);
      await shot('receipt-bottom');
      await page.getByRole('button', { name: 'Xác nhận nhận hàng' }).click(); await page.waitForTimeout(700);
      row.askConfirm = await page.getByText(/Bạn có chắc chắn đã nhận được hàng/).count();
      await shot('receipt-confirm');
    }
    row.errors = errs.length;
    rows.push(row);
    await ctx.close();
  }
  console.log(rows.map((r) => JSON.stringify(r)).join('\n'));
  await b.close(); server.close();
})();
