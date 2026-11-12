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
const products = [
  { id: 'p1', title: 'Balo Sakos đi học chống nước', priceVnd: 250000, condition: 'good', category: 'Túi xách', location: 'Ba Đình, Hà Nội', image: null },
  { id: 'p2', title: 'Balo laptop Targus 15.6 inch', priceVnd: 180000, condition: 'like-new', category: 'Túi xách', location: 'Cầu Giấy, Hà Nội', image: null },
  { id: 'p3', title: 'Balo du lịch 30L còn mới 90%', priceVnd: 290000, condition: 'fair', category: 'Túi xách', location: 'Quận 1, TP.HCM', image: null },
];
const answers = [
  { answer: 'Mình tìm được **3 chiếc balo** dưới 300.000đ trên SecondSafe:\n- Balo Sakos: 250.000đ, tình trạng tốt\n- Balo Targus: 180.000đ, như mới\n- Balo du lịch 30L: 290.000đ, khá\nBạn nên xem kỹ ảnh và mô tả rồi nhắn người bán trong hệ thống trước khi đặt mua.', products, degraded: false },
  { answer: 'Để mua an toàn, hãy thanh toán qua ví SecondSafe và không chuyển tiền ngoài hệ thống. Tiền chỉ được trả cho người bán sau khi bạn xác nhận đã nhận hàng.', products: [], degraded: false },
];
let call = 0, mode = 'ok', delay = 0;
server.listen(4178, async () => {
  const b = await chromium.launch();
  for (const [label, width, height] of [['w1280', 1280, 800], ['w360', 360, 740], ['w1920', 1920, 1080]]) {
    const ctx = await b.newContext({ viewport: { width, height } }); const page = await ctx.newPage();
    const errs = []; page.on('pageerror', (e) => errs.push(String(e.message).slice(0, 120)));
    await page.addInitScript(() => { localStorage.setItem('token', 'x.' + btoa(JSON.stringify({ userId: 'u1' })) + '.y'); localStorage.setItem('secondsafe:role', 'user'); localStorage.setItem('user', JSON.stringify({ role: 'user', _id: 'u1', fullName: 'Demo' })); });
    await page.route('http://localhost:5000/**', async (route) => {
      const url = route.request().url();
      const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      if (url.includes('/assistant/chat')) {
        if (delay) await new Promise((r) => setTimeout(r, delay));
        if (mode === 'error') return route.fulfill({ status: 503, contentType: 'application/json', headers, body: JSON.stringify({ success: false, message: 'Không thể nhận phản hồi từ dịch vụ AI lúc này.' }) });
        return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ success: true, data: answers[call++ % answers.length] }) });
      }
      const data = url.includes('/auth/profile') ? { _id: 'u1', fullName: 'Demo', role: 'user', email: 'demo@example.com' } : url.includes('unread-count') ? { count: 0, unreadCount: 0 } : [];
      return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ success: true, data }) });
    });
    call = 0; mode = 'ok'; delay = 0;
    await page.goto('http://localhost:4178/assistant', { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/${label}-empty.png` });
    delay = 1500;
    await page.getByRole('button', { name: 'Mình cần balo đi học dưới 300.000đ' }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/${label}-typing.png` });
    await page.getByText('Mình tìm được').waitFor();
    delay = 0;
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/${label}-conversation.png` });
    await page.getByLabel('Câu hỏi').fill('Mua hàng trên SecondSafe an toàn thế nào?');
    await page.getByLabel('Câu hỏi').press('Enter');
    await page.getByText('Để mua an toàn').waitFor();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/${label}-followup.png` });
    await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(400);
    const persisted = await page.getByText('Để mua an toàn').count();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    mode = 'error';
    await page.getByLabel('Câu hỏi').fill('Còn món nào khác không?');
    await page.getByRole('button', { name: 'Gửi' }).click();
    await page.getByRole('alert').waitFor();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/${label}-error.png` });
    console.log(label, 'persisted-after-reload:', persisted, 'horizontal-overflow:', overflow, 'page-errors:', errs.slice(0, 2));
    await ctx.close();
  }
  await b.close(); server.close();
});
