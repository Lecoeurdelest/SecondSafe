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
const swatch = (i) => `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="${['#fde68a', '#bfdbfe', '#fbcfe8', '#bbf7d0'][i % 4]}"/></svg>`;
const STATUSES = ['active', 'active', 'hidden', 'sold', 'pending', 'deleted'];
const product = (i) => ({ _id: 'p' + i, title: ['iPhone 13 Pro 128GB còn bảo hành', 'Giày Nike Air Force 1 size 42', 'Balo laptop chống nước', 'Sách Đắc nhân tâm bản cũ', 'Đèn bàn học LED', 'Áo khoác denim nữ'][i], price: 90000 + i * 410000, status: STATUSES[i], images: ['http://localhost:5000/uploads/a' + i + '.svg'], category: { name: 'Đồ điện tử' }, location: { city: ['Hà Nội', 'Đà Nẵng', 'Cần Thơ'][i % 3] } });
(async () => {
  await new Promise((r) => server.listen(4189, r));
  const b = await chromium.launch();
  const rows = [];
  for (const theme of ['light', 'dark']) for (const [label, width, height] of [['w1280', 1280, 900], ['w390', 390, 844]]) {
    const ctx = await b.newContext({ viewport: { width, height }, colorScheme: theme });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', (e) => errs.push(String(e.message).slice(0, 100)));
    const calls = [];
    await page.addInitScript(([th]) => {
      localStorage.setItem('secondsafe:theme', th);
      localStorage.setItem('token', 'x.' + btoa(JSON.stringify({ userId: 'u1' })) + '.y'); localStorage.setItem('secondsafe:role', 'user');
      localStorage.setItem('user', JSON.stringify({ role: 'user', _id: 'u1', fullName: 'Demo' }));
    }, [theme]);
    await page.route('http://localhost:5000/**', (route) => {
      const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
      const u = route.request().url(); const method = route.request().method();
      if (method === 'OPTIONS') return route.fulfill({ status: 204, headers });
      const json = (data) => route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ success: true, data }) });
      if (u.includes('/uploads/')) return route.fulfill({ status: 200, contentType: 'image/svg+xml', headers, body: swatch(Number((u.match(/(\d+)\.svg/) || [0, 0])[1])) });
      calls.push(method + ' ' + new URL(u).pathname + new URL(u).search);
      if (u.includes('/auth/profile')) return json({ _id: 'u1', fullName: 'Demo', role: 'user', email: 'demo@example.com' });
      if (u.includes('/products/my')) return json({ products: [0, 1, 2, 3, 4, 5].map(product), total: 6, totalPages: 1, page: 1 });
      return json([]);
    });
    const row = { theme, label };
    await page.goto('http://localhost:4189/my-products', { waitUntil: 'load' }); await page.waitForTimeout(1800);
    row.cards = await page.locator('.my-product-card').count();
    row.overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    await page.screenshot({ path: `${OUT}/${theme}-${label}-list.png`, fullPage: label === 'w390' });
    await page.getByRole('button', { name: 'Xóa' }).first().click(); await page.waitForTimeout(700);
    row.deleteDialog = await page.getByText('Xác nhận xóa').count();
    await page.screenshot({ path: `${OUT}/${theme}-${label}-delete.png` });
    await page.getByRole('button', { name: 'Hủy' }).click(); await page.waitForTimeout(600);
    await page.getByRole('button', { name: 'Ẩn', exact: true }).first().click(); await page.waitForTimeout(700);
    row.hideDialog = await page.getByText('Ẩn tin đăng').count();
    await page.getByRole('button', { name: 'Hủy' }).click(); await page.waitForTimeout(500);
    await page.locator('.ant-segmented-item', { hasText: 'Đã bán' }).click(); await page.waitForTimeout(800);
    row.filterCall = calls.filter((c) => c.includes('status=sold')).length;
    row.errors = errs.length;
    rows.push(row);
    await ctx.close();
  }
  console.log(rows.map((r) => JSON.stringify(r)).join('\n'));
  await b.close(); server.close();
})();
