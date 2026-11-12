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
const ME = 'u1';
const iso = (m) => new Date(Date.now() - m * 60000).toISOString();
const CONVS = [
  { _id: 'c1', buyerId: { _id: ME, fullName: 'Demo' }, sellerId: { _id: 's1', fullName: 'Nguyễn Văn A' }, productId: { _id: 'p1', title: 'iPhone 13 Pro 128GB' }, lastMessage: 'Giá này còn bớt không bạn?', buyerUnreadCount: 2, sellerUnreadCount: 0 },
  { _id: 'c2', buyerId: { _id: ME, fullName: 'Demo' }, sellerId: { _id: 's2', fullName: 'Trần Thị B' }, productId: { _id: 'p2', title: 'Giày Nike Air Force 1' }, lastMessage: 'Mình gửi hàng chiều nay', buyerUnreadCount: 0, sellerUnreadCount: 0 },
];
const MSGS = [
  { _id: 'm1', senderId: { _id: 's1' }, type: 'text', content: 'Chào bạn, máy còn bảo hành đến tháng 6.', createdAt: iso(50) },
  { _id: 'm2', senderId: { _id: ME }, type: 'text', content: 'Giá này còn bớt không bạn?', createdAt: iso(45) },
  { _id: 'm3', senderId: { _id: 's1' }, type: 'offer', content: 'Mình bớt chút cho bạn', createdAt: iso(40), metadata: { agreedPrice: 11800000, status: 'pending', initiatedBy: 'seller', purchaseRequestId: 'pr1' } },
];
const SUPPORT = { _id: 'sp1', subject: 'Đơn hàng và thanh toán', status: 'open', lastMessageAt: iso(10), customerId: { fullName: 'Khách A' } };
const SMSG = [
  { _id: 'sm1', senderId: ME, senderRole: 'user', content: 'Tôi chưa nhận được hàng sau 5 ngày.', createdAt: iso(30) },
  { _id: 'sm2', senderId: 'staff', senderRole: 'moderator', content: 'Chào bạn, chúng tôi đang kiểm tra với đơn vị vận chuyển.', createdAt: iso(20) },
];
(async () => {
  await new Promise((r) => server.listen(4192, r));
  const b = await chromium.launch();
  const rows = [];
  for (const theme of ['light', 'dark']) for (const [label, width, height] of [['w1280', 1280, 900], ['w390', 390, 844]]) {
    const ctx = await b.newContext({ viewport: { width, height }, colorScheme: theme });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', (e) => errs.push(String(e.message).slice(0, 100)));
    await page.addInitScript(([th, me]) => {
      localStorage.setItem('secondsafe:theme', th);
      localStorage.setItem('token', 'x.' + btoa(JSON.stringify({ userId: me })) + '.y'); localStorage.setItem('secondsafe:role', 'user');
      localStorage.setItem('user', JSON.stringify({ role: 'user', _id: me, fullName: 'Demo' }));
    }, [theme, ME]);
    await page.route('http://localhost:5000/**', (route) => {
      const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
      const u = route.request().url(); const method = route.request().method();
      if (method === 'OPTIONS') return route.fulfill({ status: 204, headers });
      const json = (data) => route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ success: true, data }) });
      if (u.includes('/auth/profile')) return json({ _id: ME, fullName: 'Demo', role: 'user', email: 'demo@example.com' });
      if (u.includes('/chat/conversations/c1/messages')) return json({ messages: MSGS });
      if (u.includes('/chat/conversations')) return json({ conversations: CONVS });
      if (u.includes('/support/conversations/sp1/messages')) return method === 'GET' ? json({ messages: SMSG }) : json({ _id: 'sm3', senderId: ME, senderRole: 'user', content: 'ok', createdAt: iso(0) });
      if (u.includes('/support/conversations')) return json({ conversations: [SUPPORT, { ...SUPPORT, _id: 'sp2', subject: 'Đổi trả và hoàn tiền', status: 'closed' }] });
      if (u.includes('/assistant/chat')) return json({ answer: 'Mình gợi ý vài món **balo** đang bán dưới 300.000đ:\n- Balo laptop chống nước\n- Balo học sinh Mikkor\nBạn muốn xem thêm theo thương hiệu không?', degraded: false, products: [{ id: 'p3', title: 'Balo laptop chống nước', category: 'Thời trang', condition: 'good', priceVnd: 250000, image: '' }, { id: 'p4', title: 'Balo học sinh Mikkor', category: 'Thời trang', condition: 'like-new', priceVnd: 180000, image: '' }] });
      return json([]);
    });
    const shot = (name, full) => page.screenshot({ path: `${OUT}/${theme}-${label}-${name}.png`, fullPage: !!full });
    const overflow = async () => await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    const row = { theme, label };
    await page.goto('http://localhost:4192/assistant', { waitUntil: 'load' }); await page.waitForTimeout(1500);
    await shot('assistant-welcome');
    await page.getByRole('button', { name: 'Mình cần balo đi học dưới 300.000đ' }).click(); await page.waitForTimeout(1500);
    row.assistantProducts = await page.locator('.assistant-chat__product').count();
    row.assistantOverflow = await overflow();
    await shot('assistant-answer');
    await page.goto('http://localhost:4192/chat/c1', { waitUntil: 'load' }); await page.waitForTimeout(1800);
    row.chatBubbles = await page.locator('.chat-bubble').count();
    row.offerButtons = await page.getByRole('button', { name: 'Chấp nhận' }).count();
    row.chatOverflow = await overflow();
    await shot('chat');
    await page.getByRole('button', { name: 'Đề nghị giá' }).click(); await page.waitForTimeout(400);
    await shot('chat-offer');
    await page.goto('http://localhost:4192/support/sp1', { waitUntil: 'load' }); await page.waitForTimeout(1800);
    row.supportMessages = await page.locator('.support-messages li:not([aria-hidden])').count();
    row.supportOverflow = await overflow();
    await shot('support');
    row.errors = errs.length;
    rows.push(row);
    await ctx.close();
  }
  console.log(rows.map((r) => JSON.stringify(r)).join('\n'));
  await b.close(); server.close();
})();
