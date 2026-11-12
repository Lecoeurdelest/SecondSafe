const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const BUILD = '/home/user/secondsafe/frontend/build';
const OUT = process.argv[2];
const S = JSON.parse(fs.readFileSync(process.argv[3]));
const THRESHOLD = process.argv[4] || '4.5';
const src = fs.readFileSync('/home/user/secondsafe/.project/evidence/TASK-079/run-01/fixture-capture.js', 'utf8');
const CONTRAST = eval('(' + src.match(/const CONTRAST = (\(\) => \{[\s\S]*?\n\});\n/)[1].replace('ratio < 3', 'ratio < ' + THRESHOLD) + ')');
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
      const low = [...await page.evaluate(CONTRAST), ...await page.evaluate(ICONS)];
      const iconCount = await page.locator('svg[viewBox="0 0 256 256"]').count(); const legacy = await page.locator('svg[viewBox="64 64 896 896"], i.fas, i.fa').count();
      if (process.argv[5] === 'shots') await page.screenshot({ path: `${OUT}/${name}.png` });
      for (const x of low) { const k = `${x.sel}|${x.fg}|${x.bg}`; if (!seen.has(k)) seen.set(k, { ...x, pages: [name] }); else seen.get(k).pages.push(name); }
      rows.push({ name, icons: iconCount, legacy, low: low.length, api: [...new Set(bad)].slice(0, 3) });
      await ctx.close();
    }
  }
  for (const r of rows) console.log(r.name.padEnd(22), 'phosphor-icons=' + r.icons, 'legacy-icons=' + r.legacy, 'low=' + r.low, r.api.length ? 'API ' + r.api.join(' | ') : '');
  console.log('--- unique offenders (below ' + THRESHOLD + ')');
  for (const x of [...seen.values()].sort((a, b) => a.ratio - b.ratio)) console.log(String(x.ratio).padEnd(5), x.sel.padEnd(52), JSON.stringify(x.text).padEnd(34), x.fg, 'on', x.bg, '[' + x.pages.length + ']');
  fs.writeFileSync(path.join(OUT, '../staff-scan-' + THRESHOLD + '.json'), JSON.stringify([...seen.values()], null, 1));
  await b.close(); server.close();
});
