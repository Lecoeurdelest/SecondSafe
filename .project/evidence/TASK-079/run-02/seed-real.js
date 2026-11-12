const path = require('path');
const root = '/home/user/secondsafe/backend';
const runtime = (n) => require(path.join(root, 'node_modules', n));
const mongoose = runtime('mongoose');
const bcrypt = runtime('bcryptjs');
const User = require(path.join(root, 'src/modules/users/user.model'));
const Product = require(path.join(root, 'src/modules/products/product.model'));
const Wallet = require(path.join(root, 'src/modules/payments/wallet.model'));
const { generateJWT } = require(path.join(root, 'src/common/utils/jwt.util'));
const fs = require('fs');
const API = 'http://localhost:5000/api';
async function call(method, url, token, body) {
  const r = await fetch(API + url, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, data: j.data, message: j.message };
}
(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const hash = await bcrypt.hash('Disposable-Only-938!', 10);
  const mk = async (email, fullName, role) => User.findOneAndUpdate({ email }, { email, fullName, role, password: hash, phone: '0900000001', address: '12 Nguyễn Trãi, Thanh Xuân, Hà Nội' }, { upsert: true, new: true, setDefaultsOnInsert: true });
  const buyer = await mk('buyer@example.test', 'Trần Thị Mua', 'user');
  const admin = await mk('admin@example.test', 'Quản trị viên', 'admin');
  const mod = await mk('mod@example.test', 'Nhân viên kiểm duyệt', 'moderator');
  const seller = await User.findOne({ email: 'seller@example.com' });
  await Wallet.findOneAndUpdate({ userId: buyer._id }, { userId: buyer._id, balance: 5000000, availableBalance: 5000000 }, { upsert: true }).catch((e) => console.log('wallet', e.message));
  const tok = (u) => generateJWT({ userId: u._id });
  const tokens = { buyer: tok(buyer), seller: tok(seller), admin: tok(admin), mod: tok(mod) };
  const out = { users: { buyer: buyer.toObject(), seller: seller.toObject(), admin: admin.toObject(), mod: mod.toObject() }, tokens, steps: [] };
  for (const u of Object.values(out.users)) delete u.password;
  const products = await Product.find({ seller: seller._id, status: 'active' }).limit(6).lean();
  out.productIds = products.map((p) => String(p._id));
  for (const p of products.slice(0, 3)) out.steps.push(['favorite', (await call('POST', '/favorites/' + p._id, tokens.buyer)).status]);
  const conv = await call('POST', '/chat/conversations', tokens.buyer, { productId: String(products[0]._id) });
  out.steps.push(['conversation', conv.status, conv.message]);
  const convId = conv.data?._id || conv.data?.conversation?._id;
  out.convId = convId;
  if (convId) {
    out.steps.push(['message1', (await call('POST', '/chat/messages', tokens.buyer, { conversationId: convId, content: 'Chào bạn, sản phẩm này còn không?', type: 'text' })).status]);
    out.steps.push(['message2', (await call('POST', '/chat/messages', tokens.seller, { conversationId: convId, content: 'Còn nhé bạn, đủ phụ kiện.', type: 'text' })).status]);
  }
  out.orders = [];
  for (const p of products.slice(1, 4)) {
    const pr = await call('POST', '/orders/purchase-request', tokens.buyer, { listingId: String(p._id), message: 'Mình muốn mua sản phẩm này', agreedPrice: p.price });
    out.steps.push(['purchase-request', pr.status, pr.message]);
    const reqId = pr.data?._id;
    if (reqId) {
      const acc = await call('POST', `/orders/${reqId}/accept`, tokens.seller);
      out.steps.push(['accept', acc.status, acc.message]);
      const oid = acc.data?.order?._id || acc.data?._id;
      if (oid) out.orders.push(String(oid));
    }
  }
  if (out.orders[0]) out.steps.push(['pay', (await call('POST', `/orders/${out.orders[0]}/pay`, tokens.buyer, {})).status]);
  if (out.orders[1]) { const r = await call('POST', `/orders/${out.orders[1]}/pay`, tokens.buyer, {}); out.steps.push(['pay2', r.status, r.message]); if (r.status < 300) out.steps.push(['ship2', (await call('POST', `/orders/${out.orders[1]}/ship`, tokens.seller, {})).status]); }
  fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out.steps));
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
