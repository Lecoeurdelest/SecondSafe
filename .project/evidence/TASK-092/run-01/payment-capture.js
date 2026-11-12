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
const PRODUCT = { _id: 'p0', title: 'iPhone 13 Pro 128GB còn bảo hành', description: 'Máy dùng một năm.', price: 12500000, condition: 'good', images: ['http://localhost:5000/uploads/a0.svg'], category: { name: 'Đồ điện tử' }, seller: { _id: 's1', fullName: 'Trần Thị Bích' }, location: { city: 'Hà Nội' } };
const ORDER = { _id: 'order1'.padEnd(24, '0'), orderCode: 'SS1001', status: 'awaiting_payment', agreedPrice: 12500000, totalAmount: 12550000, createdAt: new Date().toISOString(), buyer: { _id: 'u1', fullName: 'Nguyễn Văn An' }, seller: { _id: 's1', fullName: 'Trần Thị Bích', email: 'bich@example.com' }, listing: { title: 'iPhone 13 Pro 128GB còn bảo hành', condition: 'Tốt', images: ['http://localhost:5000/uploads/a0.svg'], location: { district: 'Quận Cầu Giấy', city: 'Hà Nội' } } };
(async () => {
  await new Promise((r) => server.listen(4196, r));
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
      if (u.includes('/payments/sepay/order/return')) {
        if (u.includes('transactionId=ok')) return json({ success: true, status: 'completed', amount: 12550000, orderId: 'order1', transactionId: 'ok1234567890' });
        if (u.includes('transactionId=bad')) return json({ success: false, status: 'failed', message: 'Ngân hàng từ chối giao dịch' });
        return json({ success: true, status: 'pending' });
      }
      if (u.includes('/wallet/balance')) return json({ balance: 100000 });
      if (u.includes('/orders/order1')) return json(ORDER);
      if (u.includes('/favorites/check')) return json({ isFavorite: false });
      if (u.includes('/products/p0')) return json(PRODUCT);
      if (u.includes('/products')) return json({ products: [], total: 0, totalPages: 0 });
      return json([]);
    });
    const shot = (name, full) => page.screenshot({ path: `${OUT}/${theme}-${label}-${name}.png`, fullPage: !!full });
    const overflow = async () => await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    const row = { theme, label };
    await page.goto('http://localhost:4196/orders/' + 'order1'.padEnd(24, '0') + '/pay', { waitUntil: 'load' }); await page.waitForTimeout(1800);
    row.payButton = await page.getByRole('button', { name: /Quét mã QR thanh toán/ }).count();
    row.payOverflow = await overflow();
    await shot('pay', true);
    await page.goto('http://localhost:4196/product/p0', { waitUntil: 'load' }); await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Mua ngay' }).click(); await page.waitForTimeout(700);
    row.quickBuyDialog = await page.getByRole('button', { name: 'Xác nhận mua ngay' }).count();
    await shot('quick-buy');
    for (const [name, id] of [['result-success', 'ok1'], ['result-failed', 'bad1'], ['result-checking', 'wait1']]) {
      await page.goto(`http://localhost:4196/orders/sepay-success?transactionId=${id}`, { waitUntil: 'load' }); await page.waitForTimeout(1500);
      row[name] = await page.getByRole('heading', { level: 1 }).first().innerText();
      row[name + 'Overflow'] = await overflow();
      if (theme === 'light' || name !== 'result-checking') await shot(name);
    }
    row.errors = errs.length;
    rows.push(row);
    await ctx.close();
  }
  console.log(rows.map((r) => JSON.stringify(r)).join('\n'));
  await b.close(); server.close();
})();
