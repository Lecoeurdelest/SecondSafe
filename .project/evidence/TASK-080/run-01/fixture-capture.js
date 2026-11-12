const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const BUILD = '/home/user/secondsafe/frontend/build';
const OUT = process.argv[2];
const THEME = process.argv[3] || 'dark';
const SHOTS = process.argv[4] !== 'noshots';
const server = http.createServer((req, res) => {
  let file = path.join(BUILD, req.url.split('?')[0]);
  if (!file.startsWith(BUILD) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(BUILD, 'index.html');
  res.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' }[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
const iso = (m) => new Date(Date.now() - m * 60000).toISOString();
const me = { _id: 'u1', fullName: 'Demo', email: 'demo@example.com', role: 'user', phone: '', avatar: '' };
const seller = { _id: 's1', fullName: 'Nguyễn Văn A', username: 'nguyenvana', rating: 4.8 };
const cat = { _id: 'c1', name: 'Đồ điện tử', slug: 'electronics' };
const mkProduct = (id, title, price, condition) => ({ _id: id, title, price, condition, description: 'Máy còn rất mới, đầy đủ phụ kiện, bảo hành còn 6 tháng. Giao dịch trực tiếp hoặc qua SecondSafe.', images: [], category: cat, seller, location: { city: 'Hà Nội', district: 'Cầu Giấy' }, status: 'active', createdAt: iso(500), views: 120 });
const products = [mkProduct('p1', 'iPhone 13 Pro 128GB còn bảo hành', 12500000, 'like-new'), mkProduct('p2', 'Giày Nike Air Force 1 size 42', 890000, 'good'), mkProduct('p3', 'Bàn học gỗ sồi', 1500000, 'fair'), mkProduct('p4', 'Áo khoác denim Levis', 450000, 'good')];
const conv = { _id: 'c1', buyerId: me, sellerId: seller, productId: products[0], lastMessage: 'Máy còn không bạn?', buyerUnreadCount: 2, sellerUnreadCount: 0, updatedAt: iso(5) };
const messages = [
  { _id: 'm1', senderId: me, type: 'text', content: 'Chào bạn, máy còn không?', createdAt: iso(30), metadata: {} },
  { _id: 'm2', senderId: seller, type: 'text', content: 'Còn nhé bạn, pin 92%, đủ phụ kiện.', createdAt: iso(25), metadata: {} },
];
const order = (id, status, p) => ({ _id: id, orderCode: 'SS-' + id, status, agreedPrice: p.price, totalAmount: p.price + 50000, createdAt: iso(300), listing: p, productId: p, seller, buyer: me, sellerId: seller, buyerId: me, shippingAddress: { fullName: 'Demo', phone: '0900000000', address: '12 Nguyễn Trãi', city: 'Hà Nội' } });
const orders = [order('o1', 'awaiting_payment', products[0]), order('o2', 'shipped', products[1]), order('o3', 'completed', products[3])];
const txs = [{ _id: 't1', type: 'topup', status: 'completed', amount: 2000000, description: 'Nạp tiền vào ví', metadata: {}, createdAt: iso(200) }, { _id: 't2', type: 'withdrawal', status: 'pending', amount: -500000, description: 'Yêu cầu rút tiền', metadata: {}, createdAt: iso(4000) }];
const notes = [{ _id: 'n1', type: 'order', title: 'Đơn hàng đã được gửi', message: 'Người bán đã gửi đơn.', isRead: false, createdAt: iso(20) }, { _id: 'n2', type: 'wallet', title: 'Nạp tiền thành công', message: 'Ví đã được cộng 2.000.000 ₫.', isRead: true, createdAt: iso(400) }];
function body(u) {
  if (u.includes('/auth/profile') || u.includes('/users/profile')) return me;
  if (/\/products\/p\d/.test(u)) return products[0];
  if (u.includes('/products')) return { products, total: 4, page: 1, totalPages: 1, limit: 12, pagination: { page: 1, totalPages: 1, total: 4 } };
  if (u.includes('/categories')) return [cat];
  if (/\/chat\/conversations\/c1\/messages/.test(u)) return { messages, total: 2, page: 1, totalPages: 1 };
  if (/\/chat\/conversations\/c1/.test(u)) return conv;
  if (u.includes('/chat/conversations')) return { conversations: [conv], total: 1 };
  if (/\/orders\/o\d/.test(u)) return orders[0];
  if (u.includes('/orders')) return { orders, total: 3, page: 1, totalPages: 1 };
  if (u.includes('/wallets/balance')) return { balance: 1250000, availableBalance: 1250000, pendingBalance: 500000, totalTopup: 2000000, totalWithdrawn: 0, totalSpent: 890000, totalEarned: 0 };
  if (u.includes('/wallets/transactions')) return { transactions: txs, total: 2, page: 1, totalPages: 1 };
  if (u.includes('/notifications/unread-count')) return { count: 1, unreadCount: 1 };
  if (u.includes('/notifications')) return { notifications: notes, pagination: { page: 1, totalPages: 1 }, unreadCount: 1 };
  if (u.includes('/favorites')) return { favorites: products.slice(0, 2), products: products.slice(0, 2), total: 2 };
  if (u.includes('/cart')) return { items: [], total: 0 };
  if (u.includes('/assistant')) return { answer: 'Mình tìm được **2 sản phẩm** phù hợp:\n- iPhone 13 Pro: 12.500.000đ\n- Giày Nike: 890.000đ', products: products.slice(0, 2).map((p) => ({ id: p._id, title: p.title, priceVnd: p.price, condition: p.condition, category: 'Đồ điện tử', location: 'Hà Nội', image: null })), degraded: false };
  return [];
}
const ROUTES = [['home', '/'], ['product-detail', '/product/p1'], ['favorites', '/favorites'], ['cart', '/cart'], ['orders', '/orders'], ['order-detail', '/orders/o1'], ['seller-orders', '/seller-orders'], ['wallet', '/wallet'], ['topup', '/wallet/topup'], ['chat', '/chat/c1'], ['assistant', '/assistant'], ['support', '/support'], ['profile', '/profile'], ['profile-edit', '/profile/edit'], ['my-products', '/my-products'], ['create-product', '/product/create'], ['login', '/login', 'out'], ['register', '/register', 'out'], ['forgot', '/forgot-password', 'out'], ['change-password', '/change-password']];
const CONTRAST = () => {
  const lum = (c) => { const a = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; };
  const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const bgOf = (el) => {
    let layers = [];
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return null;
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) { layers.push(c); if (c.a >= 0.99) break; }
    }
    let base = { r: 255, g: 255, b: 255 };
    if (!layers.length || layers[layers.length - 1].a < 0.99) base = getComputedStyle(document.documentElement).colorScheme === 'dark' || document.documentElement.dataset.theme === 'dark' ? parse(getComputedStyle(document.body).backgroundColor) || { r: 15, g: 16, b: 18 } : base;
    let out = { r: base.r, g: base.g, b: base.b };
    for (let i = layers.length - 1; i >= 0; i--) { const l = layers[i]; out = { r: l.r * l.a + out.r * (1 - l.a), g: l.g * l.a + out.g * (1 - l.a), b: l.b * l.a + out.b * (1 - l.a) }; }
    return out;
  };
  const bad = [];
  document.querySelectorAll('body *').forEach((el) => {
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
    const fg = parse(cs.color); const bg = bgOf(el); if (!fg || !bg) return;
    const f = { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a) };
    const l1 = lum([f.r, f.g, f.b]), l2 = lum([bg.r, bg.g, bg.b]);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    if (ratio < 3) bad.push({ sel: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''), text: el.textContent.trim().slice(0, 30), ratio: +ratio.toFixed(2), fg: cs.color, bg: `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})` });
  });
  return bad;
};
const ICONS = () => {
  const lum = (c) => { const a = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; };
  const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const bgOf = (el) => {
    let layers = [];
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return null;
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) { layers.push(c); if (c.a >= 0.99) break; }
    }
    let base = { r: 255, g: 255, b: 255 };
    if (!layers.length || layers[layers.length - 1].a < 0.99) base = getComputedStyle(document.documentElement).colorScheme === 'dark' || document.documentElement.dataset.theme === 'dark' ? parse(getComputedStyle(document.body).backgroundColor) || { r: 15, g: 16, b: 18 } : base;
    let out = { r: base.r, g: base.g, b: base.b };
    for (let i = layers.length - 1; i >= 0; i--) { const l = layers[i]; out = { r: l.r * l.a + out.r * (1 - l.a), g: l.g * l.a + out.g * (1 - l.a), b: l.b * l.a + out.b * (1 - l.a) }; }
    return out;
  };
  const bad = [];
  document.querySelectorAll('svg[viewBox="0 0 256 256"]').forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') return;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
    const fg = parse(cs.color); const bg = bgOf(el.parentElement || el); if (!fg || !bg) return;
    let op = 1; for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity;
    const f = { r: fg.r * fg.a * op + bg.r * (1 - fg.a * op), g: fg.g * fg.a * op + bg.g * (1 - fg.a * op), b: fg.b * fg.a * op + bg.b * (1 - fg.a * op) };
    const l1 = lum([f.r, f.g, f.b]), l2 = lum([bg.r, bg.g, bg.b]);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    if (ratio < 2.5) bad.push({ sel: (el.parentElement ? el.parentElement.tagName.toLowerCase() + (typeof el.parentElement.className === 'string' && el.parentElement.className ? '.' + el.parentElement.className.trim().split(/\s+/).slice(0, 2).join('.') : '') : 'svg'), text: 'icon', ratio: +ratio.toFixed(2), fg: cs.color, bg: `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})` });
  });
  return bad;
};
server.listen(4180, async () => {
  const b = await chromium.launch();
  const width = +(process.env.WIDTH || 1280), height = +(process.env.HEIGHT || 800);
  const ctx = await b.newContext({ viewport: { width, height }, colorScheme: THEME === 'dark' ? 'dark' : 'light' });
  const summary = [];
  for (const [name, url, auth] of ROUTES) {
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', (e) => errs.push(String(e.message).slice(0, 100)));
    await page.addInitScript((signedOut) => { if (!signedOut) { localStorage.setItem('token', 'x.' + btoa(JSON.stringify({ userId: 'u1' })) + '.y'); localStorage.setItem('secondsafe:role', 'user'); localStorage.setItem('user', JSON.stringify({ role: 'user', _id: 'u1', fullName: 'Demo' })); } }, auth === 'out');
    await page.route('http://localhost:5000/**', (route) => {
      const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ success: true, data: body(route.request().url()) }) });
    });
    await page.goto('http://localhost:4180' + url, { waitUntil: 'networkidle' }).catch(() => {}); await page.waitForTimeout(500);
    if (name === 'assistant') { await page.getByRole('button', { name: /balo|Điện thoại/ }).first().click().catch(() => {}); await page.waitForTimeout(700); }
    const theme = await page.evaluate(() => document.documentElement.dataset.theme);
    const bad = [...await page.evaluate(CONTRAST), ...await page.evaluate(ICONS)];
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (SHOTS) await page.screenshot({ path: `${OUT}/${THEME}${process.env.WIDTH ? '-w' + process.env.WIDTH : ''}-${name}.png`, fullPage: false });
    summary.push({ name, theme, overflow, errs: errs.slice(0, 1), low: bad.length, bad: bad.slice(0, 6) });
    await page.close();
  }
  for (const s of summary) { console.log(s.name.padEnd(16), s.theme, 'overflow:' + s.overflow, 'low-contrast:' + s.low, s.errs.length ? 'ERR ' + s.errs[0] : ''); for (const x of s.bad) console.log('   ', x.ratio, x.sel, JSON.stringify(x.text), x.fg, 'on', x.bg); }
  fs.writeFileSync(`${OUT}/../contrast-${THEME}${process.env.WIDTH ? '-w' + process.env.WIDTH : ''}.json`, JSON.stringify(summary, null, 1));
  await b.close(); server.close();
});
