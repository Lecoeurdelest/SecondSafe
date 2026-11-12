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
const COLORS = ['#fde68a', '#bfdbfe', '#fbcfe8', '#bbf7d0', '#ddd6fe', '#fed7aa'];
const swatch = (i) => `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="${COLORS[i % COLORS.length]}"/></svg>`;
const NAMES = ['iPhone 13 Pro 128GB còn bảo hành', 'Giày Nike Air Force 1 size 42', 'Balo laptop chống nước', 'Sách Đắc nhân tâm bản cũ', 'Đèn bàn học LED', 'Áo khoác denim nữ', 'Bộ lego thành phố 600 chi tiết', 'Máy ảnh Canon 700D', 'Nồi chiên không dầu 5L', 'Vợt cầu lông Yonex', 'Lồng chim cảnh', 'Son dưỡng chính hãng'];
const CITIES = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ'];
const product = (i) => ({
  _id: `p${i}`, title: NAMES[i % NAMES.length], price: 90000 + i * 410000, condition: 'good', description: 'Mô tả',
  images: i % 5 === 4 ? ['/images/placeholders/product-placeholder.svg'] : i % 3 === 0 ? ['http://localhost:5000/uploads/a' + i + '.svg', 'http://localhost:5000/uploads/b' + i + '.svg', 'http://localhost:5000/uploads/c' + i + '.svg'] : ['http://localhost:5000/uploads/a' + i + '.svg'],
  category: { _id: 'c1', name: 'Đồ điện tử', slug: 'electronics' }, seller: { _id: 's1', fullName: 'Nguyễn Văn A' },
  location: { city: CITIES[i % CITIES.length] }, createdAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
});
(async () => {
  await new Promise((r) => server.listen(4186, r));
  const b = await chromium.launch();
  const rows = [];
  for (const theme of ['light', 'dark']) for (const [label, width, height] of [['w1920', 1920, 1000], ['w1280', 1280, 900], ['w390', 390, 844]]) {
    for (const scenario of ['list', 'empty', 'error', 'loading']) {
      if (scenario !== 'list' && label === 'w1920') continue;
      const ctx = await b.newContext({ viewport: { width, height }, colorScheme: theme });
      const page = await ctx.newPage();
      const errs = []; page.on('pageerror', (e) => errs.push(String(e.message).slice(0, 100)));
      const queries = [];
      await page.addInitScript(([th]) => { localStorage.setItem('secondsafe:theme', th); }, [theme]);
      await page.route('http://localhost:5000/**', async (route) => {
        const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
        const url = route.request().url();
        if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
        if (url.includes('/uploads/')) return route.fulfill({ status: 200, contentType: 'image/svg+xml', headers, body: swatch(Number((url.match(/(\d+)\.svg/) || [0, 0])[1])) });
        if (url.includes('/products')) {
          queries.push(new URL(url).search);
          if (scenario === 'loading') { await new Promise((r) => setTimeout(r, 6000)); }
          if (scenario === 'error') return route.fulfill({ status: 500, contentType: 'application/json', headers, body: JSON.stringify({ success: false, message: 'x' }) });
          const list = scenario === 'empty' ? [] : Array.from({ length: 12 }, (_, i) => product(i));
          return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ success: true, data: { products: list, total: list.length ? 40 : 0, page: 1, totalPages: list.length ? 2 : 0, limit: 12 } }) });
        }
        return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ success: true, data: [] }) });
      });
      await page.goto('http://localhost:4186/', { waitUntil: 'load' }); await page.waitForTimeout(scenario === 'loading' ? 1500 : 1800);
      const tag = `${theme}-${label}-${scenario}`;
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      const row = { tag, overflow, errors: errs.length };
      if (scenario === 'list') {
        row.cards = await page.locator('a.listing-link').count();
        row.columns = await page.evaluate(() => new Set([...document.querySelectorAll('a.listing-link')].map((a) => Math.round(a.getBoundingClientRect().left))).size);
        if (width > 1000 || (theme === 'light' && width < 500)) await page.screenshot({ path: `${OUT}/${tag}-top.png`, clip: { x: 0, y: 0, width, height: Math.min(height, 900) } });
        else await page.screenshot({ path: `${OUT}/${tag}-top.png`, clip: { x: 0, y: 0, width, height } });
        if (label === 'w1280') {
          await page.getByRole('button', { name: 'Sách' }).click(); await page.waitForTimeout(800);
          row.chipPressed = await page.getByRole('button', { name: 'Sách' }).getAttribute('aria-pressed');
          await page.getByRole('combobox', { name: 'Lọc theo tình trạng' }).click(); await page.waitForTimeout(500);
          await page.screenshot({ path: `${OUT}/${tag}-condition-open.png`, clip: { x: 0, y: 0, width, height: 700 } });
          await page.getByText('Như mới', { exact: true }).last().click(); await page.waitForTimeout(800);
          await page.getByRole('textbox', { name: 'Tìm sản phẩm' }).fill('balo');
          const before = queries.length;
          await page.waitForTimeout(600);
          row.requestsWhileTyping = queries.length - before;
          await page.getByRole('button', { name: 'Tìm kiếm' }).click(); await page.waitForTimeout(800);
          row.lastQuery = decodeURIComponent(queries[queries.length - 1]);
        } else {
          await page.evaluate(() => window.scrollTo(0, 600)); await page.waitForTimeout(300);
          await page.screenshot({ path: `${OUT}/${tag}-cards.png` });
        }
      } else {
        await page.evaluate(() => { const main = document.querySelector('.home__main'); window.scrollTo(0, main.getBoundingClientRect().top + window.scrollY - 140); });
        await page.waitForTimeout(300);
        await page.screenshot({ path: `${OUT}/${tag}.png` });
      }
      rows.push(row);
      await ctx.close();
    }
  }
  console.log(rows.map((r) => JSON.stringify(r)).join('\n'));
  await b.close(); server.close();
})();
