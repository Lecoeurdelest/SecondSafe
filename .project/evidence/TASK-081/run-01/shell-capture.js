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
const notes = [
  { _id: 'n1', type: 'order_shipped', title: 'Đơn hàng đã được gửi', message: 'Người bán đã gửi đơn SS-10019.', isRead: false, createdAt: iso(20) },
  { _id: 'n2', type: 'payment_success', title: 'Thanh toán thành công', message: 'Bạn đã thanh toán 890.000 ₫.', isRead: false, createdAt: iso(60) },
  { _id: 'n3', type: 'security', title: 'Đăng nhập mới', message: 'Tài khoản vừa đăng nhập từ thiết bị mới.', isRead: true, createdAt: iso(400) },
];
const product = (id, title, price) => ({ _id: id, title, price, condition: 'good', description: 'Mô tả', images: [], category: { _id: 'c1', name: 'Đồ điện tử', slug: 'electronics' }, seller: { _id: 's1', fullName: 'Nguyễn Văn A' }, location: { city: 'Hà Nội', district: 'Cầu Giấy' }, status: 'active', createdAt: iso(500) });
function body(u) {
  if (u.includes('/auth/profile')) return { _id: 'u1', fullName: 'Demo', role: 'user', email: 'demo@example.com' };
  if (u.includes('/notifications/unread-count')) return { count: 2, unreadCount: 2 };
  if (u.includes('/notifications')) return { notifications: notes, pagination: { page: 1, totalPages: 1 }, unreadCount: 2 };
  if (u.includes('/products')) return { products: [product('p1', 'iPhone 13 Pro 128GB', 12500000), product('p2', 'Giày Nike Air Force 1', 890000)], total: 2, page: 1, totalPages: 1, limit: 12 };
  return [];
}
(async () => {
  await new Promise((r) => server.listen(4183, r));
  const b = await chromium.launch();
  const scenarios = [];
  for (const theme of ['light', 'dark']) for (const [label, width, height] of [['w1280', 1280, 800], ['w390', 390, 800]]) scenarios.push({ theme, label, width, height });
  for (const { theme, label, width, height } of scenarios) {
    for (const signedIn of [true, false]) {
      const ctx = await b.newContext({ viewport: { width, height }, colorScheme: theme });
      const page = await ctx.newPage();
      const errs = []; page.on('pageerror', (e) => errs.push(String(e.message).slice(0, 100)));
      await page.addInitScript(([si, th]) => { localStorage.setItem('secondsafe:theme', th); if (si) { localStorage.setItem('token', 'x.' + btoa(JSON.stringify({ userId: 'u1' })) + '.y'); localStorage.setItem('secondsafe:role', 'user'); localStorage.setItem('user', JSON.stringify({ role: 'user', _id: 'u1', fullName: 'Demo' })); } }, [signedIn, theme]);
      await page.route('http://localhost:5000/**', (route) => {
        const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
        if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
        return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ success: true, data: body(route.request().url()) }) });
      });
      await page.goto('http://localhost:4183/', { waitUntil: 'load' }); await page.waitForTimeout(1500);
      const tag = `${theme}-${label}-${signedIn ? 'in' : 'out'}`;
      await page.screenshot({ path: `${OUT}/${tag}-header.png`, clip: { x: 0, y: 0, width, height: Math.min(height, 330) } });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      let extra = '';
      if (signedIn) {
        await page.getByRole('button', { name: /Thông báo/ }).click(); await page.waitForTimeout(900);
        await page.screenshot({ path: `${OUT}/${tag}-notifications.png` });
        const items = await page.locator('.notification-item').count(); extra += ` notification-items=${items}`;
        await page.keyboard.press('Escape'); await page.waitForTimeout(300);
      }
      await page.getByRole('button', { name: 'Ngôn ngữ' }).click(); await page.waitForTimeout(500);
      await page.screenshot({ path: `${OUT}/${tag}-language.png`, clip: { x: 0, y: 0, width, height: 260 } });
      await page.keyboard.press('Escape'); await page.waitForTimeout(300);
      await page.getByRole('button', { name: /Trung tâm hỗ trợ/ }).click(); await page.waitForTimeout(700);
      await page.screenshot({ path: `${OUT}/${tag}-support.png` });
      console.log(tag.padEnd(24), 'overflow=' + overflow, 'errors=' + errs.length, extra);
      await ctx.close();
    }
  }
  await b.close(); server.close();
})();
