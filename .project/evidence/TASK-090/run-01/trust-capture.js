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
const SELLER = { _id: 's1', fullName: 'Trần Thị Bích', createdAt: '2025-06-01T00:00:00Z', rating: 4.2, totalReviews: 5 };
const REVIEWS = [
  { _id: 'r1', rating: 5, comment: 'Giao hàng nhanh, đóng gói cẩn thận, đúng mô tả.', createdAt: d(3), reviewerId: { fullName: 'Nguyễn Văn An' }, evidenceFiles: ['http://localhost:5000/uploads/a1.svg', 'http://localhost:5000/uploads/a2.svg'], productId: { title: 'Balo laptop chống nước', images: ['http://localhost:5000/uploads/a0.svg'] } },
  { _id: 'r2', rating: 4, comment: 'Hàng ổn, hơi trầy nhẹ so với ảnh.', createdAt: d(10), reviewerId: { fullName: 'Lê Thị Cúc' }, productId: { title: 'Sách Đắc nhân tâm', images: ['http://localhost:5000/uploads/a1.svg'] } },
  { _id: 'r3', rating: 3, comment: '', createdAt: d(20), reviewerId: { fullName: 'Phạm Minh Đức' } },
];
const PRODUCT = { _id: 'p0', title: 'iPhone 13 Pro 128GB còn bảo hành', description: 'Máy dùng một năm.', price: 12500000, condition: 'good', images: ['http://localhost:5000/uploads/a0.svg'], category: { name: 'Đồ điện tử' }, seller: { _id: 's1', fullName: 'Trần Thị Bích' }, location: { city: 'Hà Nội' } };
(async () => {
  await new Promise((r) => server.listen(4194, r));
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
      if (u.includes('/rating-stats')) return json({ averageRating: 4.2, totalReviews: 3 });
      if (u.includes('/reviews/users/')) return json({ reviews: REVIEWS, pagination: { totalPages: 2, page: 1 } });
      if (u.includes('/users/s1/stats')) return json({ rating: 4.2, totalReviews: 5 });
      if (u.includes('/users/s1/public')) return json(SELLER);
      if (u.includes('/favorites/check')) return json({ isFavorite: false });
      if (u.includes('/products/p0')) return json(PRODUCT);
      if (u.includes('/products')) return json({ products: [], total: 0, totalPages: 0 });
      return json([]);
    });
    const shot = (name, full) => page.screenshot({ path: `${OUT}/${theme}-${label}-${name}.png`, fullPage: !!full });
    const overflow = async () => await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    const row = { theme, label };
    await page.goto('http://localhost:4194/user/s1/reviews', { waitUntil: 'load' }); await page.waitForTimeout(1800);
    row.reviewCards = await page.locator('.review-item').count();
    row.reviewsOverflow = await overflow();
    await shot('reviews', true);
    await page.goto('http://localhost:4194/user/s1', { waitUntil: 'load' }); await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Báo cáo người dùng' }).click(); await page.waitForTimeout(800);
    row.userReportDialog = await page.getByText('Báo cáo người dùng', { exact: true }).count();
    await shot('report-user');
    await page.getByRole('button', { name: 'Gửi báo cáo' }).count();
    await page.getByRole('button', { name: 'Gửi báo cáo' }).click({ force: true }).catch(() => {});
    row.sendDisabled = await page.getByRole('button', { name: 'Gửi báo cáo' }).isDisabled();
    await page.goto('http://localhost:4194/product/p0', { waitUntil: 'load' }); await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Báo cáo tin đăng này' }).click(); await page.waitForTimeout(800);
    row.productReportDialog = await page.getByText('Báo cáo sản phẩm').count();
    await page.getByRole('combobox', { name: 'Lý do báo cáo' }).click(); await page.waitForTimeout(400);
    await page.getByTitle('Lừa đảo').first().click(); await page.waitForTimeout(300);
    await page.getByLabel('Mô tả chi tiết').fill('Người bán yêu cầu chuyển khoản trước khi xem hàng.'); await page.waitForTimeout(300);
    row.sendEnabled = await page.getByRole('button', { name: 'Gửi báo cáo' }).isEnabled();
    await shot('report-product');
    row.errors = errs.length;
    rows.push(row);
    await ctx.close();
  }
  console.log(rows.map((r) => JSON.stringify(r)).join('\n'));
  await b.close(); server.close();
})();
