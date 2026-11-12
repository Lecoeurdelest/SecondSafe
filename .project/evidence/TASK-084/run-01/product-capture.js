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
const COLORS = ['#fde68a', '#bfdbfe', '#fbcfe8', '#bbf7d0', '#ddd6fe', '#fed7aa'];
const swatch = (i) => `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="${COLORS[i % COLORS.length]}"/></svg>`;
const NAMES = ['iPhone 13 Pro 128GB còn bảo hành, đầy đủ hộp và phụ kiện', 'Giày Nike Air Force 1 size 42', 'Balo laptop chống nước', 'Sách Đắc nhân tâm bản cũ', 'Đèn bàn học LED', 'Áo khoác denim nữ'];
const product = (i) => ({
  _id: `p${i}`, title: NAMES[i % NAMES.length], price: 90000 + i * 410000, condition: 'good',
  description: 'Máy dùng một năm, pin còn 92%, không trầy xước đáng kể.\nTặng kèm ốp lưng và cáp sạc chính hãng.\nGiao dịch trực tiếp tại Hà Nội hoặc gửi qua SecondSafe.',
  images: ['http://localhost:5000/uploads/a' + i + '.svg'], category: { _id: 'c1', name: 'Đồ điện tử', slug: 'electronics' },
  seller: { _id: 's1', fullName: 'Nguyễn Văn A' }, location: { district: 'Ba Đình', city: 'Hà Nội' }, createdAt: new Date(Date.now() - i * 86400000).toISOString(),
});
(async () => {
  await new Promise((r) => server.listen(4187, r));
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
      calls.push(method + ' ' + new URL(u).pathname);
      if (u.includes('/auth/profile')) return json({ _id: 'u1', fullName: 'Demo', role: 'user', email: 'demo@example.com' });
      if (u.includes('/favorites/check')) return json({ isFavorite: false });
      if (u.includes('/favorites')) return method === 'GET' ? json({ favorites: Array.from({ length: 8 }, (_, i) => ({ _id: 'f' + i, product: product(i) })), total: 8, totalPages: 1 }) : json({ success: true });
      if (u.includes('/cart')) return method === 'GET' ? json({ items: Array.from({ length: 3 }, (_, i) => ({ _id: 'c' + i, product: product(i) })), total: 45, page: 1, totalPages: 3 }) : json({ inCart: true });
      if (u.includes('/products/p')) return json(product(0));
      return json([]);
    });
    const shot = (name, full) => page.screenshot({ path: `${OUT}/${theme}-${label}-${name}.png`, fullPage: !!full });
    const noOverflow = async () => !(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth));
    await page.goto('http://localhost:4187/product/p0', { waitUntil: 'load' }); await page.waitForTimeout(1500);
    const row = { theme, label, detailHeading: await page.getByRole('heading', { level: 1 }).count(), detailOverflow: !(await noOverflow()) };
    await shot('detail');
    await page.getByRole('button', { name: 'Thêm yêu thích' }).click(); await page.waitForTimeout(700);
    row.favoritePressed = await page.getByRole('button', { name: 'Đã yêu thích' }).getAttribute('aria-pressed');
    await page.getByRole('button', { name: 'Thêm vào giỏ hàng' }).click(); await page.waitForTimeout(700);
    row.notice = await page.getByRole('status').filter({ hasText: 'giỏ hàng' }).count();
    await shot('detail-notice');
    await page.goto('http://localhost:4187/cart', { waitUntil: 'load' }); await page.waitForTimeout(1500);
    row.cartItems = await page.locator('.cart-item').count(); row.cartOverflow = !(await noOverflow());
    await shot('cart');
    await page.goto('http://localhost:4187/favorites', { waitUntil: 'load' }); await page.waitForTimeout(1500);
    row.favoriteCards = await page.locator('.favorite-card').count(); row.favoritesOverflow = !(await noOverflow());
    await shot('favorites');
    await page.getByRole('button', { name: 'Bỏ lưu' }).first().click(); await page.waitForTimeout(500);
    row.confirmShown = await page.getByText('Xóa khỏi yêu thích?').count();
    await shot('favorites-confirm');
    row.errors = errs.length;
    rows.push(row);
    await ctx.close();
  }
  console.log(rows.map((r) => JSON.stringify(r)).join('\n'));
  await b.close(); server.close();
})();
