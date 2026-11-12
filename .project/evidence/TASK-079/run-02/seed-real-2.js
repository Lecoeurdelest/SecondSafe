const fs = require('fs');
const S = JSON.parse(fs.readFileSync(process.argv[2]));
const API = 'http://localhost:5000/api';
async function call(method, url, token, body) {
  const r = await fetch(API + url, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, data: j.data, message: j.message };
}
(async () => {
  const t = S.tokens, steps = [];
  for (const id of S.productIds.slice(0, 3)) steps.push(['favorite', (await call('POST', '/favorites', t.buyer, { productId: id })).status]);
  const conv = await call('POST', '/chat/conversations', t.buyer, { productId: S.productIds[0], sellerId: S.users.seller._id });
  steps.push(['conversation', conv.status, conv.message]);
  const convId = conv.data?._id || conv.data?.conversation?._id; S.convId = convId;
  if (convId) {
    steps.push(['message1', (await call('POST', '/chat/messages', t.buyer, { conversationId: convId, content: 'Chào bạn, sản phẩm này còn không?', type: 'text' })).status]);
    steps.push(['message2', (await call('POST', '/chat/messages', t.seller, { conversationId: convId, content: 'Còn nhé bạn, đủ phụ kiện.', type: 'text' })).status]);
  }
  steps.push(['report', (await call('POST', '/reports/product', t.buyer, { productId: S.productIds[5], reason: 'scam', description: 'Giá thấp bất thường, nghi ngờ lừa đảo.' })).status]);
  fs.writeFileSync(process.argv[2], JSON.stringify(S, null, 1));
  console.log(JSON.stringify(steps));
})();
