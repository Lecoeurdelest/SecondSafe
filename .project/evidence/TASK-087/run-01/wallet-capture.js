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
const BALANCE = { balance: 1500000, availableWithdrawalBalance: 1300000, pendingWithdrawalAmount: 200000, totalDeposited: 3000000, totalWithdrawn: 500000, totalSpent: 800000, totalEarned: 100000 };
const d = (n) => new Date(Date.now() - n * 86400000).toISOString();
const TX = [
  { _id: 't1', type: 'deposit', status: 'completed', amount: 500000, description: 'Nạp tiền qua SePay', createdAt: d(1) },
  { _id: 't2', type: 'payment', status: 'completed', amount: -250000, createdAt: d(2) },
  { _id: 't3', type: 'withdrawal', status: 'pending', amount: -200000, createdAt: d(3), metadata: { bankName: 'MBBank', bankAccount: '0123456789', accountHolder: 'NGUYEN VAN A' } },
  { _id: 't4', type: 'withdrawal', status: 'failed', amount: -100000, failureReason: 'Sai số tài khoản', createdAt: d(4), metadata: { bankName: 'ACB', bankAccount: '999999' } },
  { _id: 't5', type: 'deposit', status: 'pending', amount: 70000, createdAt: d(5) },
  { _id: 't6', type: 'earning', status: 'completed', amount: 90000, createdAt: d(6) },
];
(async () => {
  await new Promise((r) => server.listen(4191, r));
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
      calls.push(method + ' ' + new URL(u).pathname + new URL(u).search);
      if (u.includes('/auth/profile')) return json({ _id: 'u1', fullName: 'Demo', role: 'user', email: 'demo@example.com' });
      if (u.includes('/wallets/balance')) return json(BALANCE);
      if (u.includes('/wallets/transactions')) { const wd = u.includes('type=withdrawal'); return json({ transactions: wd ? TX.filter((t) => t.type === 'withdrawal') : TX, pagination: { total: 25, totalPages: 3, page: 1 } }); }
      return json([]);
    });
    const shot = (name, full) => page.screenshot({ path: `${OUT}/${theme}-${label}-${name}.png`, fullPage: !!full });
    const overflow = async () => await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    const row = { theme, label };
    await page.goto('http://localhost:4191/wallet', { waitUntil: 'load' }); await page.waitForTimeout(1800);
    row.walletHeading = await page.getByRole('heading', { level: 1, name: 'Ví của tôi' }).count();
    row.transactions = await page.locator('.transaction-item').count();
    row.walletOverflow = await overflow();
    await shot('wallet', true);
    await page.goto('http://localhost:4191/wallet/topup', { waitUntil: 'load' }); await page.waitForTimeout(1200);
    await page.getByRole('button', { name: '200.000 VNĐ' }).click(); await page.waitForTimeout(400);
    row.topupSummary = await page.getByText('Thông tin thanh toán').count();
    row.topupOverflow = await overflow();
    await shot('topup', true);
    await page.goto('http://localhost:4191/wallet/withdraw', { waitUntil: 'load' }); await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Tạo yêu cầu rút tiền' }).count();
    await page.getByLabel('Số tiền (VNĐ)').fill('60000'); await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Tạo yêu cầu rút tiền' }).click(); await page.waitForTimeout(600);
    row.withdrawErrors = await page.locator('.ant-form-item-explain-error').count();
    row.withdrawOverflow = await overflow();
    await shot('withdraw', true);
    await page.goto('http://localhost:4191/wallet/topup-result?success=false&message=Giao%20d%E1%BB%8Bch%20b%E1%BB%8B%20t%E1%BB%AB%20ch%E1%BB%91i', { waitUntil: 'load' }); await page.waitForTimeout(1000);
    row.resultOverflow = await overflow();
    await shot('result-failed');
    await page.goto('http://localhost:4191/wallet/topup-success?amount=250000&orderInfo=Nap%20vi&transactionId=TX123', { waitUntil: 'load' }); await page.waitForTimeout(1000);
    await shot('result-success');
    row.errors = errs.length;
    rows.push(row);
    await ctx.close();
  }
  console.log(rows.map((r) => JSON.stringify(r)).join('\n'));
  await b.close(); server.close();
})();
