const { chromium } = require('playwright');
const L = require('./qa-lib.js');
const { body2, hex } = require('./fixtures2.js');
const OUT = L.OUT;
const PORT = L.PORT;
const ONLY = process.argv[2] ? new RegExp(process.argv[2]) : null;

// Reports FA icons that render blank or use families that are not bundled (only solid is), plus antd icons without svg.
const ICONS = () => {
  const out = [];
  document.querySelectorAll('i, span[class*="fa-"], .anticon').forEach((el) => {
    const r = el.getBoundingClientRect();
    const cls = String(el.className);
    if (el.tagName === 'I' && !/\bfa[srb]?\b|fa-/.test(cls)) return;
    if (!r.width || !r.height) { if (/fa-/.test(cls)) out.push(`hidden/zero-size: ${cls}`); return; }
    if (el.classList.contains('anticon')) { if (!el.querySelector('svg')) out.push(`anticon without svg: ${cls}`); return; }
    const before = getComputedStyle(el, '::before');
    const ff = getComputedStyle(el).fontFamily;
    if (/\b(far|fab|fa-regular|fa-brands)\b/.test(cls)) out.push(`non-solid family (not bundled): ${cls}`);
    else if (!before.content || before.content === 'none' || before.content === 'normal' || before.content === '""') out.push(`BLANK (no glyph content): ${cls}`);
    else if (!/Font Awesome/i.test(ff)) out.push(`wrong font-family ${ff}: ${cls}`);
  });
  return [...new Set(out)];
};

// Elements that stick out past the right edge of the viewport (excluding fixed/absolute overlays).
const OFFSCREEN = () => {
  const out = [];
  const w = window.innerWidth;
  document.querySelectorAll('body *').forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed') return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    if (r.right > w + 2 || r.left < -2) {
      let overflowClipped = false;
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        const o = getComputedStyle(a);
        if (/(hidden|auto|scroll)/.test(o.overflowX) && a.getBoundingClientRect().right <= w + 2) { overflowClipped = true; break; }
      }
      if (overflowClipped) return;
      out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(/\s+/).slice(0, 2).join('.')} right=${Math.round(r.right)} left=${Math.round(r.left)} "${(el.textContent || '').trim().slice(0, 24)}"`);
    }
  });
  return out.slice(0, 8);
};

const HUE = (sel) => {
  const out = new Map();
  const toHsl = (r, g, b) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; if (mx === mn) return [0, 0, l]; const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [h * 60, s, l]; };
  const name = (h) => (h < 15 || h >= 345 ? 'red' : h < 45 ? 'orange' : h < 70 ? 'amber' : h < 170 ? 'green' : h < 200 ? 'cyan' : h < 255 ? 'blue' : h < 290 ? 'purple' : 'pink');
  const root = document.querySelector(sel) || document.querySelector('#main-content') || document.body;
  root.querySelectorAll('*').forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const props = [['bg', cs.backgroundColor], ['bt', cs.borderTopWidth !== '0px' ? cs.borderTopColor : null], ['bb', cs.borderBottomWidth !== '0px' ? cs.borderBottomColor : null], ['bl', cs.borderLeftWidth !== '0px' ? cs.borderLeftColor : null], ['color', own ? cs.color : null]];
    for (const [prop, val] of props) {
      if (!val) continue;
      const m = val.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/);
      if (!m) continue;
      const a = m[4] === undefined ? 1 : parseFloat(m[4]);
      if (a < 0.4) continue;
      const [h, s, l] = toHsl(+m[1], +m[2], +m[3]);
      if (s < 0.3 || l > 0.97 || l < 0.08) continue;
      const hue = name(h);
      if (hue === 'green' || hue === 'amber') continue;
      const cls = (el.className && el.className.baseVal === undefined ? String(el.className) : '').split(/\s+/).filter(Boolean).slice(0, 3).join('.') || el.tagName.toLowerCase();
      const key = `${hue}|${prop}|${val}|${cls}`;
      if (!out.has(key)) out.set(key, { hue, prop, val, cls, text: (el.textContent || '').trim().slice(0, 28) });
    }
  });
  return [...out.values()].slice(0, 30);
};

const D = [1440, 900], B = [1280, 800], M = [390, 844];
const A = (id) => `/admin/${id}`;
const scenarios = [
  // [role, name, url, viewport, opts]
  // 1. admin details
  ['admin', 'admin-order-detail', `/admin/orders/${hex(11)}`, D],
  ['admin', 'admin-order-detail-select-open', `/admin/orders/${hex(11)}`, D, { act: async (p) => { await p.locator('.ant-select').first().click(); await p.waitForTimeout(400); }, fullPage: false }],
  ['admin', 'admin-order-detail-cancelled', `/admin/orders/${hex(17)}`, D],
  ['admin', 'admin-report-detail', `/admin/reports/${hex(1)}`, D],
  ['admin', 'admin-report-detail-product', `/admin/reports/${hex(2)}`, D],
  ['admin', 'admin-dispute-detail', `/admin/disputes/${hex(22)}`, D],
  ['admin', 'admin-dispute-detail-return', `/admin/disputes/${hex(24)}`, D],
  // 2. moderator details
  ['moderator', 'mod-order-detail', `/moderator/orders/${hex(11)}`, D],
  ['moderator', 'mod-order-detail-popconfirm', `/moderator/orders/${hex(11)}`, D, { act: async (p) => { await p.getByRole('button', { name: /Ép hủy/ }).click(); await p.waitForTimeout(400); }, fullPage: false, scroll: '.ant-popover' }],
  ['moderator', 'mod-report-detail', `/moderator/reports/${hex(1)}`, D],
  ['moderator', 'mod-report-detail-suspended', `/moderator/reports/${hex(5)}`, D],
  ['moderator', 'mod-report-detail-resolved', `/moderator/reports/${hex(3)}`, D],
  ['moderator', 'mod-dispute-detail', `/moderator/disputes/${hex(22)}`, D],
  ['moderator', 'mod-dispute-detail-pending', `/moderator/disputes/${hex(21)}`, D],
  ['moderator', 'mod-dispute-detail-resolved', `/moderator/disputes/${hex(23)}`, D],
  ['moderator', 'mod-profile', '/moderator/profile', D],
  // 3. buyer lists
  ['user', 'buyer-orders-buying', '/orders', B],
  ['user', 'buyer-orders-buying-paid', '/orders', B, { act: async (p) => { await p.selectOption('.order-filters select', 'paid'); await p.waitForTimeout(700); } }],
  ['user', 'buyer-orders-buying-shipped', '/orders', B, { act: async (p) => { await p.selectOption('.order-filters select', 'shipped'); await p.waitForTimeout(700); } }],
  ['user', 'buyer-orders-selling', '/orders', B, { act: async (p) => { await p.locator('.tab-button').nth(1).click(); await p.waitForTimeout(700); } }],
  ['user', 'buyer-orders-selling-paid', '/orders', B, { act: async (p) => { await p.locator('.tab-button').nth(1).click(); await p.waitForTimeout(500); await p.selectOption('.order-filters select', 'paid'); await p.waitForTimeout(700); } }],
  ['user', 'seller-orders-cho-giao', '/seller-orders', B, { act: async (p) => { await p.getByRole('button', { name: /Chờ giao/ }).first().click(); await p.waitForTimeout(500); } }],
  ['user', 'seller-orders-dang-giao', '/seller-orders', B, { act: async (p) => { await p.getByRole('button', { name: /Đang giao/ }).first().click(); await p.waitForTimeout(500); } }],
  // 4. buyer order details
  ['user', 'buyer-order-disputed', '/orders/o4', B],
  ['user', 'buyer-order-disputed-followup-modal', '/orders/o4?action=followup', B, { fullPage: false }],
  ['user', 'buyer-order-cancelled', '/orders/o5', B],
  ['user', 'seller-order-disputed-return', '/orders/o6', B],
  ['user', 'buyer-order-delivered', '/orders/o7', B],
  // 5. notifications
  ['user', 'notif-panel', '/orders', B, { notif: true, fullPage: false, act: async (p) => { await p.getByRole('button', { name: /Thông báo/ }).click(); await p.waitForTimeout(900); }, scanRoot: '.notification-panel' }],
  ['user', 'notif-panel-scrolled', '/orders', B, { notif: true, fullPage: false, act: async (p) => { await p.getByRole('button', { name: /Thông báo/ }).click(); await p.waitForTimeout(900); await p.evaluate(() => { const l = document.querySelector('.notification-list'); l.scrollTop = l.scrollHeight; }); await p.waitForTimeout(300); }, scanRoot: '.notification-panel' }],
  ['user', 'notif-panel-mid', '/orders', B, { notif: true, fullPage: false, act: async (p) => { await p.getByRole('button', { name: /Thông báo/ }).click(); await p.waitForTimeout(900); await p.evaluate(() => { document.querySelector('.notification-list').scrollTop = 300; }); await p.waitForTimeout(300); }, scanRoot: '.notification-panel' }],
  ['user', 'notif-panel-mobile', '/orders', M, { notif: true, fullPage: false, act: async (p) => { await p.getByRole('button', { name: /Thông báo/ }).click(); await p.waitForTimeout(900); }, scanRoot: '.notification-panel' }],
  ['moderator', 'notif-panel-staff', '/moderator/orders', D, { notif: true, fullPage: false, act: async (p) => { await p.getByRole('button', { name: /Thông báo/ }).click(); await p.waitForTimeout(900); }, scanRoot: '.notification-panel' }],
  // mobile staff
  ['admin', 'm-admin-order-detail', `/admin/orders/${hex(11)}`, M],
  ['admin', 'm-admin-report-detail', `/admin/reports/${hex(1)}`, M],
  ['admin', 'm-admin-dispute-detail', `/admin/disputes/${hex(22)}`, M],
  ['admin', 'm-admin-menu-open', `/admin/orders/${hex(11)}`, M, { fullPage: false, act: async (p) => { await p.locator('.admin-header__menu-btn').click(); await p.waitForTimeout(600); } }],
  ['moderator', 'm-mod-order-detail', `/moderator/orders/${hex(11)}`, M],
  ['moderator', 'm-mod-report-detail', `/moderator/reports/${hex(1)}`, M],
  ['moderator', 'm-mod-dispute-detail', `/moderator/disputes/${hex(22)}`, M],
  ['moderator', 'm-mod-profile', '/moderator/profile', M],
  ['moderator', 'm-mod-drawer-open', `/moderator/orders/${hex(11)}`, M, { fullPage: false, act: async (p) => { await p.locator('.moderator-menu-trigger').click(); await p.waitForTimeout(700); } }],
];

L.server.listen(PORT, async () => {
  const b = await chromium.launch();
  for (const [role, name, url, vp, opts = {}] of scenarios) {
    if (ONLY && !ONLY.test(name)) continue;
    const ctx = await b.newContext({ viewport: { width: vp[0], height: vp[1] } });
    const page = await ctx.newPage();
    await page.addInitScript(([role]) => {
      const uid = role === 'admin' ? 'a1' : role === 'moderator' ? 'm1' : 'u1';
      localStorage.setItem('token', 'x.' + btoa(JSON.stringify({ userId: uid })) + '.y');
      localStorage.setItem('secondsafe:role', role);
      localStorage.setItem('user', JSON.stringify({ role, _id: uid, id: uid, fullName: 'Demo' }));
    }, [role]);
    const unhandled = [];
    await page.route('http://localhost:5000/**', (route) => {
      const req = route.request();
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
      const data = body2(role, req.url(), opts);
      if (Array.isArray(data) && data.length === 0 && !/chat|abandoned-checkouts$/.test(req.url())) unhandled.push(new URL(req.url()).pathname);
      return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ success: true, data }) });
    });
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e.message).slice(0, 160)));
    await page.goto(`http://localhost:${PORT}${url}`, { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(900);
    if (opts.act) { try { await opts.act(page); } catch (e) { errs.push('ACT FAILED: ' + String(e.message).split('\n')[0]); } }
    const crashed = await page.getByText('Không thể hiển thị trang lúc này').count();
    const finalUrl = new URL(page.url()).pathname + new URL(page.url()).search;
    const full = opts.fullPage !== false;
    const H = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
    const slices = [];
    if (full && H > 1700) {
      const step = vp[0] < 600 ? 1500 : 1300;
      for (let y = 0, i = 1; y < H; y += step, i++) {
        await page.screenshot({ path: `${OUT}/${name}-s${i}.png`, fullPage: true, clip: { x: 0, y, width: vp[0], height: Math.min(step, H - y) } });
        slices.push(`${name}-s${i}.png`);
      }
    }
    const hues = await page.evaluate(HUE, opts.scanRoot || null).catch(() => []);
    const icons = await page.evaluate(ICONS).catch(() => []);
    const off = await page.evaluate(OFFSCREEN).catch(() => []);
    const over = await page.evaluate(L.OVERFLOW).catch(() => []);
    console.log(`\n=== ${name}  ${url}${finalUrl !== url ? '  -> NOW ' + finalUrl : ''}  H=${H} crashed=${crashed} errs=${JSON.stringify(errs.slice(0, 3))}${slices.length ? ' slices=' + slices.length : ''}`);
    if (unhandled.length) console.log('  unhandled api:', [...new Set(unhandled)].join(', '));
    if (over.length) console.log('  overflow:', over.join(' | '));
    if (off.length) console.log('  offscreen:', off.join(' | '));
    if (icons.length) console.log('  icons:', icons.join(' | '));
    if (hues.length) console.log('  hues:\n' + hues.map((h) => `    ${h.hue.padEnd(7)} ${h.prop.padEnd(6)} ${h.val.padEnd(24)} .${h.cls}  "${h.text}"`).join('\n'));
    await ctx.close();
  }
  await b.close(); L.server.close();
});
