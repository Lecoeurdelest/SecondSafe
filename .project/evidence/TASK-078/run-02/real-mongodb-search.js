const W = process.argv[2] + '/backend';
const mongoose = require(W + '/node_modules/mongoose');
require(W + '/src/modules/products/category.model');
const { searchProducts } = require(W + '/src/modules/assistant/assistant-chat.service');
(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const Product = require(W + '/src/modules/products/product.model');
  const idx = await Product.collection.indexes();
  console.log('indexes:', idx.map((i) => i.name).join(', '));
  const cases = [
    { query: 'sách' }, { query: 'balo thú cưng', maxPriceVnd: 400000 }, { query: 'Harry Potter' },
    { query: 'điện thoại', condition: 'like-new' }, { query: 'ba lô (xanh)' }, { query: 'zzzzqqq' }, { query: 'sách', maxPriceVnd: 100000, minPriceVnd: 60000 },
  ];
  for (const c of cases) {
    const r = await searchProducts(c);
    console.log(JSON.stringify(c), '->', r.length, 'results', r.slice(0, 3).map((p) => `${p.title} ${p.priceVnd} ${p.condition}`));
    for (const p of r) {
      if (c.maxPriceVnd && p.priceVnd > c.maxPriceVnd) throw new Error('price filter broken');
      if (c.condition && p.condition !== c.condition) throw new Error('condition filter broken');
    }
  }
  await mongoose.disconnect();
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
