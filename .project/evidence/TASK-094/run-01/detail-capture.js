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
const BASE = { _id: ID, orderCode: 'SS1001', agreedPrice: 12500000, totalAmount: 12550000, platformFee: 625000, createdAt: d(8),
  listing: { _id: 'p0', title: 'iPhone 13 Pro 128GB còn bảo hành', description: 'Máy dùng một năm, đủ phụ kiện, pin 92%.', condition: 'good', images: ['http://localhost:5000/uploads/a0.svg'], category: { name: 'Đồ điện tử' }, location: { city: 'Hà Nội', district: 'Cầu Giấy' } },
  seller: { _id: 's1', fullName: 'Trần Thị Bích' }, buyer: { _id: 'u1', fullName: 'Nguyễn Văn An' } };
const SCENES = {
  buyerPending: { order: { ...BASE, status: 'awaiting_payment' }, as: 'u1' },
  completed: { order: { ...BASE, status: 'completed', paidAt: d(7), shippedAt: d(5), deliveredAt: d(3), completedAt: d(2), shipping: { provider: 'ghn', trackingNumber: 'GHN-SS1001-AB12CD', estimatedDelivery: d(3), notes: 'Gọi trước khi giao' } }, as: 'u1',
    review: { rating: 4, comment: 'Giao nhanh, máy đúng mô tả.', createdAt: d(1), evidenceFiles: ['http://localhost:5000/uploads/a1.svg', 'http://localhost:5000/uploads/a2.svg'] } },
  disputed: { order: { ...BASE, status: 'disputed', paidAt: d(7), shippedAt: d(5) }, as: 's1',
    dispute: { _id: 'dp1', reason: 'not_as_described', status: 'investigating', description: 'Máy bị trầy nhiều so với ảnh.', moderatorNotes: 'Đang xem xét bằng chứng của hai bên.', createdAt: d(3), investigatingAt: d(2),
      disputeConversation: [{ senderRole: 'buyer', content: 'Máy bị trầy nhiều so với ảnh.', createdAt: d(3), evidenceFiles: ['http://localhost:5000/uploads/a1.svg'] }, { senderRole: 'moderator', content: 'Moderator đã tiếp nhận, mời người bán phản hồi.', createdAt: d(2), evidenceFiles: [] }] } }
};
(async () => {
  await new Promise((r) => server.listen(4198, r));
  const b = await chromium.launch();
  const rows = [];
  for (const theme of ['light', 'dark']) for (const [label, width, height] of [['w1280', 1280, 900], ['w390', 390, 844]]) {
    const row = { theme, label };
    for (const [scene, cfg] of Object.entries(SCENES)) {
      const ctx = await b.newContext({ viewport: { width, height }, colorScheme: theme });
      const page = await ctx.newPage();
      const errs = []; page.on('pageerror', (e) => errs.push(String(e.message).slice(0, 100)));
      await page.addInitScript(([th, uid]) => {
        localStorage.setItem('secondsafe:theme', th);
        localStorage.setItem('token', 'x.' + btoa(JSON.stringify({ userId: uid })) + '.y'); localStorage.setItem('secondsafe:role', 'user');
        localStorage.setItem('user', JSON.stringify({ role: 'user', _id: uid, fullName: 'Người dùng' }));
      }, [theme, cfg.as]);
      await page.route('http://localhost:5000/**', (route) => {
        const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
        const u = route.request().url(); const method = route.request().method();
        if (method === 'OPTIONS') return route.fulfill({ status: 204, headers });
        const json = (data) => route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ success: true, data }) });
        if (u.includes('/uploads/')) return route.fulfill({ status: 200, contentType: 'image/svg+xml', headers, body: swatch(Number((u.match(/(\d+)\.svg/) || [0, 0])[1])) });
        if (u.includes('/auth/profile')) return json({ _id: cfg.as, fullName: 'Người dùng', role: 'user' });
        if (u.includes('/can-review')) return json({ canReview: false });
        if (u.includes('/review')) return json(cfg.review || null);
        if (u.includes('/dispute')) return json(cfg.dispute || null);
        if (u.includes(`/orders/${ID}`)) return json(cfg.order);
        return json([]);
      });
      const shot = (name, full) => page.screenshot({ path: `${OUT}/${theme}-${label}-${scene}${name}.png`, fullPage: !!full });
      await page.goto(`http://localhost:4198/orders/${ID}`, { waitUntil: 'load' }); await page.waitForTimeout(2000);
      row[scene + 'Cards'] = await page.locator('.detail-card').count();
      row[scene + 'Overflow'] = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      await shot('', true);
      if (scene === 'buyerPending') {
        await page.getByRole('button', { name: /Hủy đơn/ }).click(); await page.waitForTimeout(600);
        row.cancelDialog = await page.getByText('Hủy đơn hàng', { exact: true }).count();
        await shot('-cancel');
      }
      if (scene === 'disputed') {
        await page.getByRole('button', { name: /Cung cấp bằng chứng cho mod/ }).click(); await page.waitForTimeout(600);
        row.responseDialog = await page.getByText('Phản hồi khiếu nại', { exact: true }).count();
        await shot('-response');
      }
      row[scene + 'Errors'] = errs.length;
      await ctx.close();
    }
    rows.push(row);
  }
  console.log(rows.map((r) => JSON.stringify(r)).join('\n'));
  await b.close(); server.close();
})();
