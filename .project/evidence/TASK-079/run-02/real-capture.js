const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const BUILD = '/home/user/secondsafe/frontend/build';
const OUT = process.argv[2];
const S = JSON.parse(fs.readFileSync(process.argv[3]));
const src = fs.readFileSync(path.join(__dirname, '../run-01/fixture-capture.js'), 'utf8');
const CONTRAST = eval('(' + src.match(/const CONTRAST = (\(\) => \{[\s\S]*?\n\});\n/)[1] + ')');
const server = http.createServer((req, res) => {
  let file = path.join(BUILD, req.url.split('?')[0]);
  if (!file.startsWith(BUILD) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(BUILD, 'index.html');
  res.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png' }[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
const P = S.productIds[0], O = S.orders[0], C = S.convId;
const BUYER = [['home', '/'], ['product-detail', '/product/' + P], ['favorites', '/favorites'], ['cart', '/cart'], ['orders', '/orders'], ['order-detail', '/orders/' + O], ['wallet', '/wallet'], ['chat', '/chat/' + C], ['assistant', '/assistant'], ['support', '/support'], ['profile', '/profile'], ['purchase-requests', '/purchase-requests']];
const SELLER = [['seller-orders', '/seller-orders'], ['my-products', '/my-products']];
const ADMIN = [['admin-dashboard', '/admin'], ['admin-users', '/admin/users'], ['admin-products', '/admin/products'], ['admin-reports', '/admin/reports'], ['admin-orders', '/admin/orders'], ['admin-reviews', '/admin/reviews'], ['admin-withdrawals', '/admin/withdrawals'], ['admin-disputes', '/admin/disputes'], ['admin-revenue', '/admin/revenue']];
const MOD = [['staff-dashboard', '/staff'], ['mod-reports', '/moderator/reports'], ['mod-orders', '/moderator/orders'], ['mod-disputes', '/moderator/disputes'], ['mod-reviews', '/moderator/reviews'], ['mod-withdrawals', '/moderator/withdrawals'], ['mod-profile', '/moderator/profile']];
const plan = [
  ...BUYER.map((r) => ({ who: 'buyer', theme: 'dark', route: r })), ...BUYER.map((r) => ({ who: 'buyer', theme: 'light', route: r })),
  ...SELLER.map((r) => ({ who: 'seller', theme: 'dark', route: r })),
  ...ADMIN.map((r) => ({ who: 'admin', theme: 'dark', route: r })), ...MOD.map((r) => ({ who: 'mod', theme: 'dark', route: r })),
];
server.listen(4181, async () => {
  const b = await chromium.launch();
  const rows = [];
  for (const { who, theme, route: [name, url] } of plan) {
    const user = S.users[who === 'mod' ? 'mod' : who];
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: theme });
    const page = await ctx.newPage();
    const errs = [], bad = [];
    page.on('pageerror', (e) => errs.push(String(e.message).slice(0, 100)));
    page.on('response', (r) => { if (r.url().startsWith('http://localhost:5000') && r.status() >= 400) bad.push(r.status() + ' ' + r.url().replace('http://localhost:5000', '').slice(0, 60)); });
    await page.addInitScript(([tok, role, u, pref]) => { localStorage.setItem('token', tok); localStorage.setItem('secondsafe:role', role); localStorage.setItem('user', JSON.stringify(u)); localStorage.setItem('secondsafe:theme', pref); }, [S.tokens[who], user.role, user, theme]);
    await page.goto('http://localhost:4181' + url, { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(700);
    const th = await page.evaluate(() => document.documentElement.dataset.theme);
    const low = await page.evaluate(CONTRAST);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    const text = await page.evaluate(() => document.body.innerText.length);
    const tag = `${who}-${theme}-${name}`;
    if (theme === 'dark' || who !== 'buyer') await page.screenshot({ path: `${OUT}/${tag}.png` });
    rows.push({ tag, theme: th, overflow, text, low: low.length, bad: low.slice(0, 4), api: [...new Set(bad)].slice(0, 4), errs: errs.slice(0, 1) });
    await ctx.close();
  }
  for (const r of rows) {
    console.log(r.tag.padEnd(34), 'theme=' + r.theme, 'overflow=' + r.overflow, 'chars=' + r.text, 'low=' + r.low, r.api.length ? 'API ' + r.api.join(' | ') : '', r.errs.length ? 'ERR ' + r.errs[0] : '');
    for (const x of r.bad) console.log('     ', x.ratio, x.sel, JSON.stringify(x.text), x.fg, 'on', x.bg);
  }
  fs.writeFileSync(path.join(OUT, '../real-backend-scan.json'), JSON.stringify(rows, null, 1));
  await b.close(); server.close();
});
