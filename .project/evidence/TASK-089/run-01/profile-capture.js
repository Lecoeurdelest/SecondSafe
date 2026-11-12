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
const ME = { _id: 'u1', fullName: 'Nguyễn Văn An', email: 'an@example.test', phone: '0912345678', address: 'Hà Nội', role: 'user', rating: 4.5, totalReviews: 12, createdAt: '2025-03-15T00:00:00Z', specificAddress: 'Số 10 Ngõ 20', location: { city: 'Hà Nội', district: 'Ba Đình', ward: '', provinceCode: 1, districtCode: 10, wardCode: null } };
const SELLER = { _id: 's1', fullName: 'Trần Thị Bích', createdAt: '2025-06-01T00:00:00Z', rating: 4.2, totalReviews: 5 };
const PRODUCTS = [0, 1, 2, 3].map((i) => ({ _id: 'p' + i, title: ['Balo laptop chống nước', 'Sách Đắc nhân tâm bản cũ', 'Đèn bàn học LED', 'Áo khoác denim nữ'][i], price: 90000 + i * 120000, images: ['http://localhost:5000/uploads/a' + i + '.svg'], location: { district: 'Ba Đình', city: 'Hà Nội' } }));
(async () => {
  await new Promise((r) => server.listen(4193, r));
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
    await page.route('https://provinces.open-api.vn/**', (route) => {
      const u = route.request().url(); const headers = { 'access-control-allow-origin': '*' };
      const json = (d) => route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify(d) });
      if (u.includes('/d/')) return json({ wards: [{ code: 100, name: 'Phúc Xá' }] });
      if (u.includes('/p/1')) return json({ districts: [{ code: 10, name: 'Ba Đình' }, { code: 11, name: 'Cầu Giấy' }] });
      return json([{ code: 1, name: 'Hà Nội' }, { code: 79, name: 'TP. Hồ Chí Minh' }]);
    });
    await page.route('http://localhost:5000/**', (route) => {
      const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
      const u = route.request().url(); const method = route.request().method();
      if (method === 'OPTIONS') return route.fulfill({ status: 204, headers });
      const json = (data) => route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ success: true, data }) });
      if (u.includes('/uploads/')) return route.fulfill({ status: 200, contentType: 'image/svg+xml', headers, body: swatch(Number((u.match(/(\d+)\.svg/) || [0, 0])[1])) });
      if (u.includes('/auth/profile') || u.includes('/users/profile')) return json(ME);
      if (u.includes('/users/s1/stats') || u.includes('/stats')) return json({ rating: 4.8, totalReviews: 9 });
      if (u.includes('/users/s1') || u.includes('/users/public')) return json(SELLER);
      if (u.includes('/products')) return json({ products: PRODUCTS, total: 4, totalPages: 1 });
      return json([]);
    });
    const shot = (name, full) => page.screenshot({ path: `${OUT}/${theme}-${label}-${name}.png`, fullPage: !!full });
    const overflow = async () => await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    const row = { theme, label };
    await page.goto('http://localhost:4193/profile', { waitUntil: 'load' }); await page.waitForTimeout(1800);
    row.profileHeading = await page.getByRole('heading', { level: 1, name: 'Thông tin tài khoản' }).count();
    row.quickLinks = await page.locator('.quick-actions a').count();
    row.profileOverflow = await overflow();
    await shot('profile', true);
    await page.goto('http://localhost:4193/profile/edit', { waitUntil: 'load' }); await page.waitForTimeout(1800);
    row.editHeading = await page.getByRole('heading', { level: 1, name: 'Chỉnh sửa thông tin' }).count();
    row.editOverflow = await overflow();
    await shot('edit', true);
    await page.goto('http://localhost:4193/user/s1', { waitUntil: 'load' }); await page.waitForTimeout(1800);
    row.sellerHeading = await page.getByRole('heading', { level: 1, name: 'Trần Thị Bích' }).count();
    row.sellerCards = await page.locator('.user-product-card').count();
    row.sellerOverflow = await overflow();
    await shot('seller', true);
    row.errors = errs.length;
    rows.push(row);
    await ctx.close();
  }
  console.log(rows.map((r) => JSON.stringify(r)).join('\n'));
  await b.close(); server.close();
})();
