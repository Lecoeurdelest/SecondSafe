const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const BUILD = '/home/user/secondsafe/frontend/build';
const OUT = process.argv[2];
const S = JSON.parse(fs.readFileSync(process.argv[3]));
const THRESHOLD = process.argv[4] || '4.5';
const src = fs.readFileSync('/home/user/secondsafe/.project/evidence/TASK-079/run-01/fixture-capture.js', 'utf8');
const CONTRAST = eval('(' + src.match(/const CONTRAST = (\(\) => \{[\s\S]*?\n\});\n/)[1].replace('ratio < 3', 'ratio < ' + THRESHOLD) + ')');
const server = http.createServer((req, res) => {
  let file = path.join(BUILD, req.url.split('?')[0]);
  if (!file.startsWith(BUILD) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(BUILD, 'index.html');
  res.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png' }[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
async function api(url, token) { const r = await fetch('http://localhost:5000/api' + url, { headers: { authorization: 'Bearer ' + token } }); return (await r.json()).data; }
server.listen(4181, async () => {
  const reports = await api('/reports?limit=5', S.tokens.mod);
  const reportId = (reports?.reports || reports?.items || reports || [])[0]?._id;
  const O = S.orders[0];
  const plan = [
    ['admin', [['admin-dashboard', '/admin'], ['admin-users', '/admin/users'], ['admin-products', '/admin/products'], ['admin-reports', '/admin/reports'], ['admin-report-detail', '/admin/reports/' + reportId], ['admin-orders', '/admin/orders'], ['admin-order-detail', '/admin/orders/' + O], ['admin-reviews', '/admin/reviews'], ['admin-withdrawals', '/admin/withdrawals'], ['admin-disputes', '/admin/disputes'], ['admin-revenue', '/admin/revenue']]],
    ['mod', [['staff-dashboard', '/staff'], ['mod-reports', '/moderator/reports'], ['mod-report-detail', '/moderator/reports/' + reportId], ['mod-orders', '/moderator/orders'], ['mod-order-detail', '/moderator/orders/' + O], ['mod-disputes', '/moderator/disputes'], ['mod-reviews', '/moderator/reviews'], ['mod-withdrawals', '/moderator/withdrawals'], ['mod-profile', '/moderator/profile']]],
  ];
  const b = await chromium.launch();
  const seen = new Map(); const rows = [];
  for (const [who, routes] of plan) {
    for (const [name, url] of routes) {
      const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
      const page = await ctx.newPage();
      const bad = [];
      page.on('response', (r) => { if (r.url().startsWith('http://localhost:5000') && r.status() >= 400) bad.push(r.status() + ' ' + r.url().replace('http://localhost:5000', '').slice(0, 50)); });
      const user = S.users[who];
      await page.addInitScript(([tok, role, u]) => { localStorage.setItem('token', tok); localStorage.setItem('secondsafe:role', role); localStorage.setItem('user', JSON.stringify(u)); }, [S.tokens[who], user.role, user]);
      await page.goto('http://localhost:4181' + url, { waitUntil: 'networkidle' }).catch(() => {}); await page.waitForTimeout(800);
      const low = await page.evaluate(CONTRAST);
      if (process.argv[5] === 'shots') await page.screenshot({ path: `${OUT}/${name}.png` });
      for (const x of low) { const k = `${x.sel}|${x.fg}|${x.bg}`; if (!seen.has(k)) seen.set(k, { ...x, pages: [name] }); else seen.get(k).pages.push(name); }
      rows.push({ name, low: low.length, api: [...new Set(bad)].slice(0, 3) });
      await ctx.close();
    }
  }
  for (const r of rows) console.log(r.name.padEnd(22), 'low=' + r.low, r.api.length ? 'API ' + r.api.join(' | ') : '');
  console.log('--- unique offenders (below ' + THRESHOLD + ')');
  for (const x of [...seen.values()].sort((a, b) => a.ratio - b.ratio)) console.log(String(x.ratio).padEnd(5), x.sel.padEnd(52), JSON.stringify(x.text).padEnd(34), x.fg, 'on', x.bg, '[' + x.pages.length + ']');
  fs.writeFileSync(path.join(OUT, '../staff-scan-' + THRESHOLD + '.json'), JSON.stringify([...seen.values()], null, 1));
  await b.close(); server.close();
});
