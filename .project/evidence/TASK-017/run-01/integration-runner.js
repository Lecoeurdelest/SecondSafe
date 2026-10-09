const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { MongoMemoryReplSet } = require(process.env.TASK_MONGO_MODULE || '/tmp/secondsafe-mongo/node_modules/mongodb-memory-server');
const root = path.resolve(__dirname, '../../../..');
const mongoose = require(path.join(root, 'backend/node_modules/mongoose'));
const request = require(path.join(root, 'backend/node_modules/supertest'));
const Category = require(path.join(root, 'backend/src/modules/products/category.model'));
const app = require(path.join(root, 'backend/src/app'));

async function main() {
  const server = await MongoMemoryReplSet.create({ binary: { version: '7.0.24' }, replSet: { count: 1 } });
  const transcript = [];
  try {
    await mongoose.connect(server.getUri('secondsafe_disposable_categories'));
    await Category.create([
      { name: 'Zeta', slug: 'zeta', description: 'Last', icon: 'z' },
      { name: 'Alpha', slug: 'alpha', description: 'First', icon: 'a' },
      { name: 'Hidden', slug: 'hidden', isActive: false }
    ]);
    const list = await request(app).get('/api/categories');
    transcript.push({ case: 'active categories sorted by name', status: list.status, body: list.body });
    assert.equal(list.status, 200);
    assert.deepEqual(list.body.data.map(category => category.name), ['Alpha', 'Zeta']);
    assert.equal(list.body.data[0].description, 'First');
    assert.equal(list.body.data[0].isActive, undefined);
    const active = await request(app).get('/api/categories/alpha');
    transcript.push({ case: 'active slug detail', status: active.status, body: active.body });
    assert.equal(active.status, 200);
    assert.equal(active.body.data.slug, 'alpha');
    for (const slug of ['hidden', 'missing']) {
      const response = await request(app).get(`/api/categories/${slug}`);
      transcript.push({ case: slug, status: response.status, body: response.body });
      assert.equal(response.status, 404);
      assert.equal(response.body.message, 'Danh mục không tồn tại');
    }
    await Category.deleteMany({});
    const empty = await request(app).get('/api/categories');
    transcript.push({ case: 'empty public category list', status: empty.status, body: empty.body });
    assert.equal(empty.status, 200);
    assert.deepEqual(empty.body.data, []);
    fs.writeFileSync(path.join(__dirname, 'http-transcript.json'), JSON.stringify(transcript, null, 2) + '\n');
    console.log('PASS: five category HTTP scenarios, 12 assertions against real MongoDB 7.0.24 replica set');
  } finally {
    await mongoose.disconnect();
    await server.stop();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
