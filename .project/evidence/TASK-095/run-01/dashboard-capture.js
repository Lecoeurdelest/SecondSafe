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
const ADMIN = { generatedAt: new Date().toISOString(), users: { total: 1284, byRole: { user: 1250 } },
  products: { total: 3420, byStatus: { active: 2210, hidden: 340, sold: 760, pending: 110 }, byCategory: [{ category: 'Đồ điện tử', count: 920 }, { category: 'Thời trang', count: 780 }, { category: 'Sách', count: 610 }, { category: 'Đồ gia dụng', count: 430 }] },
  orders: { total: 980, byStatus: { completed: 610, paid: 120, shipped: 90, disputed: 24, cancelled: 136 }, monthly: [{ month: '2026-06', count: 110 }, { month: '2026-07', count: 135 }, { month: '2026-08', count: 160 }, { month: '2026-09', count: 190 }, { month: '2026-10', count: 205 }, { month: '2026-11', count: 180 }] },
  purchaseRequests: { byStatus: { pending: 14 } }, reports: { byStatus: { pending: 6, reviewing: 3 } }, disputes: { byStatus: { investigating: 9, pending: 4, resolved: 40 } },
  transactions: { feeRevenueVnd: 48250000 }, pendingWithdrawals: 7, wallets: { total: 1190 } };
const STAFF = { generatedAt: new Date().toISOString(), openDisputes: 13, pendingPurchaseRequests: 14, openOrders: 210, activeDeliveries: 90,
  recentQueue: [{ label: 'Tranh chấp cần xem xét', count: 13 }, { label: 'Báo cáo chờ xử lý', count: 9 }, { label: 'Yêu cầu rút tiền', count: 7 }, { label: 'Đánh giá chờ duyệt', count: 0 }] };
const BUCKET = { total: 40, recovered: 18, lost: 12, active: 10, recoveredAmount: 8200000, lostAmount: 5100000, activeAmount: 3300000, recoveryRate: 45 };
const PRODUCTS = { products: [
  { _id: 'p1', title: 'iPhone 13 Pro 128GB còn bảo hành', price: 12500000, status: 'active', images: ['http://localhost:5000/uploads/a0.svg'], category: { name: 'Đồ điện tử' }, seller: { fullName: 'Trần Thị Bích' } },
  { _id: 'p2', title: 'Sách Đắc nhân tâm bản đẹp', price: 90000, status: 'hidden', images: ['http://localhost:5000/uploads/a1.svg'], category: { name: 'Sách' }, seller: { fullName: 'Lê Thị Cúc' } },
  { _id: 'p3', title: 'Đèn bàn LED cảm ứng', price: 220000, status: 'pending', images: ['http://localhost:5000/uploads/a2.svg'], category: { name: 'Đồ gia dụng' }, seller: { fullName: 'Phạm Minh Đức' } },
  { _id: 'p4', title: 'Giày chạy bộ size 42', price: 650000, status: 'sold', images: [], category: null, seller: { fullName: 'Nguyễn Văn An' } }], total: 90, totalPages: 3 };
(async () => {
  await new Promise((r) => server.listen(4199, r));
  const b = await chromium.launch();
  const rows = [];
  for (const theme of ['light', 'dark']) for (const [label, width, height] of [['w1280', 1280, 900], ['w390', 390, 844]]) {
    const row = { theme, label };
    for (const [scene, cfg] of Object.entries({ admin: { role: 'admin', path: '/admin' }, staff: { role: 'moderator', path: '/staff' }, products: { role: 'admin', path: '/admin/products' } })) {
      const ctx = await b.newContext({ viewport: { width, height }, colorScheme: theme });
      const page = await ctx.newPage();
      const errs = []; page.on('pageerror', (e) => errs.push(String(e.message).slice(0, 100)));
      await page.addInitScript(([th, role]) => {
        localStorage.setItem('secondsafe:theme', th);
        localStorage.setItem('token', 'x.' + btoa(JSON.stringify({ userId: 'u1' })) + '.y'); localStorage.setItem('secondsafe:role', role);
        localStorage.setItem('user', JSON.stringify({ role, _id: 'u1', fullName: 'Nhân sự' }));
      }, [theme, cfg.role]);
      await page.route('http://localhost:5000/**', (route) => {
        const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
        const u = route.request().url(); const method = route.request().method();
        if (method === 'OPTIONS') return route.fulfill({ status: 204, headers });
        const json = (data) => route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ success: true, data }) });
        if (u.includes('/uploads/')) return route.fulfill({ status: 200, contentType: 'image/svg+xml', headers, body: swatch(Number((u.match(/(\d+)\.svg/) || [0, 0])[1])) });
        if (u.includes('/auth/profile')) return json({ _id: 'u1', fullName: 'Nhân sự', role: cfg.role });
        if (u.includes('/abandoned-checkouts/summary')) return json({ ...BUCKET, bySource: { order: BUCKET, cart: { ...BUCKET, total: 0 } } });
        if (u.includes('/products/admin')) return json(PRODUCTS);
        if (u.includes('/moderator/dashboard')) return json(STAFF);
        if (u.includes('/users/admin/dashboard')) return json(ADMIN);
        return json([]);
      });
      await page.goto(`http://localhost:4199${cfg.path}`, { waitUntil: 'load' }); await page.waitForTimeout(2200);
      row[scene + 'Heading'] = (await page.getByRole('heading', { level: 1 }).first().innerText().catch(() => 'none')).slice(0, 40);
      row[scene + 'Overflow'] = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      row[scene + 'Bars'] = await page.locator('[role="progressbar"]').count();
      row[scene + 'Rows'] = await page.locator('.ant-table-row').count();
      await page.screenshot({ path: `${OUT}/${theme}-${label}-${scene}.png`, fullPage: true });
      row[scene + 'Errors'] = errs.length;
      await ctx.close();
    }
    rows.push(row);
  }
  console.log(rows.map((r) => JSON.stringify(r)).join('\n'));
  await b.close(); server.close();
})();
