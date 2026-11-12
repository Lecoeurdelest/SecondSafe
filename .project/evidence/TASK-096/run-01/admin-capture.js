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
const REPORT = { summary: { completedOrders: 126, grossRevenue: 98250000, platformRevenue: 4912500, sellerPayout: 93337500 },
  breakdown: ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'].map((period, i) => ({ period, completedOrders: 12 + i * 6, grossRevenue: 9000000 + i * 2300000, platformRevenue: 450000 + i * 115000, sellerPayout: 8550000 + i * 2185000 })),
  topProducts: [{ productId: 'p1', title: 'iPhone 13 Pro 128GB', completedOrders: 9, grossRevenue: 112500000, platformRevenue: 5625000, sellerPayout: 106875000 }, { productId: 'p2', title: 'Laptop Dell XPS 13', completedOrders: 6, grossRevenue: 78000000, platformRevenue: 3900000, sellerPayout: 74100000 }],
  recentOrders: [{ orderId: 'o1aaaaaaaa', orderCode: 'SS2001', productTitle: 'Máy ảnh film cũ', buyerName: 'Nguyễn Văn An', sellerName: 'Trần Thị Bích', grossRevenue: 520000, platformRevenue: 26000, sellerPayout: 494000, completedAt: new Date().toISOString() }] };
(async () => {
  await new Promise((r) => server.listen(4200, r));
  const b = await chromium.launch();
  const rows = [];
  for (const [label, width, height] of [['w1280', 1280, 900], ['w390', 390, 844]]) {
    const ctx = await b.newContext({ viewport: { width, height } });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', (e) => errs.push(String(e.message).slice(0, 100)));
    await page.addInitScript(() => {
      localStorage.setItem('token', 'x.' + btoa(JSON.stringify({ userId: 'a1' })) + '.y'); localStorage.setItem('secondsafe:role', 'admin');
      localStorage.setItem('user', JSON.stringify({ role: 'admin', _id: 'a1', fullName: 'Quản Trị Viên' }));
    });
    await page.route('http://localhost:5000/**', (route) => {
      const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
      const u = route.request().url(); const method = route.request().method();
      if (method === 'OPTIONS') return route.fulfill({ status: 204, headers });
      const json = (data) => route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ success: true, data }) });
      if (u.includes('/auth/profile')) return json({ _id: 'a1', fullName: 'Quản Trị Viên', role: 'admin' });
      if (u.includes('revenue')) return json(REPORT);
      return json([]);
    });
    const row = { label };
    await page.goto('http://localhost:4200/admin/revenue', { waitUntil: 'load' }); await page.waitForTimeout(2500);
    row.heading = await page.getByRole('heading', { level: 1 }).first().innerText().catch(() => 'none');
    row.tableRows = await page.locator('.ant-table-row').count();
    row.overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    row.menuItems = await page.locator('.admin-sidebar .ant-menu-item').count();
    await page.screenshot({ path: `${OUT}/${label}-revenue.png`, fullPage: true });
    if (width < 800) {
      await page.getByRole('button', { name: 'Mở menu' }).click(); await page.waitForTimeout(500);
      await page.screenshot({ path: `${OUT}/${label}-menu-open.png` });
      await page.getByRole('button', { name: 'Đóng menu' }).click(); await page.waitForTimeout(400);
    } else {
      await page.screenshot({ path: `${OUT}/${label}-top.png` });
    }
    await page.getByRole('button', { name: /Quản Trị Viên/ }).first().click(); await page.waitForTimeout(500);
    row.logoutItem = await page.getByText('Đăng xuất').count();
    await page.screenshot({ path: `${OUT}/${label}-account-menu.png` });
    row.errors = errs.length;
    rows.push(row);
    await ctx.close();
  }
  console.log(rows.map((r) => JSON.stringify(r)).join('\n'));
  await b.close(); server.close();
})();
