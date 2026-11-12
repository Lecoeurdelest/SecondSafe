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
let mode = 'ok';
function body(u) {
  if (u.includes('/auth/login')) return mode === 'twofa' ? { requires2FA: true, email: 'person@example.test' } : null;
  return [];
}
(async () => {
  await new Promise((r) => server.listen(4185, r));
  const b = await chromium.launch();
  const rows = [];
  for (const theme of ['light', 'dark']) for (const [label, width, height] of [['w1280', 1280, 800], ['w390', 390, 800]]) {
    const ctx = await b.newContext({ viewport: { width, height }, colorScheme: theme });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', (e) => errs.push(String(e.message).slice(0, 100)));
    await page.addInitScript(([th]) => { localStorage.setItem('secondsafe:theme', th); }, [theme]);
    await page.route('http://localhost:5000/**', (route) => {
      const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      const u = route.request().url();
      if (u.includes('/auth/login')) return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ success: true, data: { requires2FA: true, email: 'person@example.test' } }) });
      if (u.includes('/auth/register') || u.includes('/auth/forgot')) return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ success: true, data: { message: 'Nếu email đã đăng ký, hướng dẫn khôi phục sẽ được gửi đến hộp thư.' } }) });
      return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ success: true, data: [] }) });
    });
    const shot = (name) => page.screenshot({ path: `${OUT}/${theme}-${label}-${name}.png` });
    const noOverflow = async () => !(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth));
    // login: empty, validation, two-factor
    await page.goto('http://localhost:4185/login', { waitUntil: 'load' }); await page.waitForTimeout(1200);
    await shot('login');
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).last().click(); await page.waitForTimeout(500);
    const errorsShown = await page.locator('.ant-form-item-explain-error').count();
    await shot('login-validation');
    await page.getByLabel('Email').fill('person@example.test'); await page.getByLabel('Mật khẩu', { exact: true }).fill('StrongPass1!');
    await page.getByRole('button', { name: 'Hiện mật khẩu' }).click();
    const revealed = await page.getByLabel('Mật khẩu', { exact: true }).getAttribute('type');
    await page.locator('form').getByRole('button', { name: 'Đăng nhập' }).click(); await page.waitForTimeout(900);
    const twoFactor = await page.getByLabel('Mã xác thực 6 chữ số').count();
    await shot('login-2fa');
    rows.push({ page: 'login', theme, label, validationErrors: errorsShown, passwordRevealedType: revealed, twoFactorStep: twoFactor, noOverflow: await noOverflow() });
    for (const [name, url] of [['register', '/register'], ['forgot', '/forgot-password']]) {
      await page.goto('http://localhost:4185' + url, { waitUntil: 'load' }); await page.waitForTimeout(1000);
      await shot(name);
      rows.push({ page: name, theme, label, noOverflow: await noOverflow() });
    }
    await page.evaluate(() => { localStorage.setItem('token', 'x.' + btoa(JSON.stringify({ userId: 'u1' })) + '.y'); localStorage.setItem('secondsafe:role', 'user'); localStorage.setItem('user', JSON.stringify({ role: 'user', _id: 'u1', fullName: 'Demo' })); });
    await page.goto('http://localhost:4185/change-password', { waitUntil: 'load' }); await page.waitForTimeout(1200);
    await shot('change-password');
    rows.push({ page: 'change-password', theme, label, noOverflow: await noOverflow(), pageErrors: errs.length });
    await ctx.close();
  }
  console.log(JSON.stringify(rows.filter((r) => r.page === 'login' || r.pageErrors !== undefined).map((r) => ({ ...r })), null, 0).replace(/\},\{/g, '},\n{'));
  await b.close(); server.close();
})();
