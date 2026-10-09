const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { MongoMemoryReplSet } = require(process.env.SECONDSAFE_MONGO_RUNTIME || '/tmp/secondsafe-mongo/node_modules/mongodb-memory-server');
const root = path.resolve(__dirname, '../../../..');
const mongoose = require(path.join(root, 'backend/node_modules/mongoose'));
const output = __dirname;
fs.mkdirSync(output, { recursive: true });

async function main() {
  const repl = await MongoMemoryReplSet.create({ binary: { version: '7.0.24' }, replSet: { count: 1, storageEngine: 'wiredTiger' } });
  const uri = repl.getUri('secondsafe_disposable_validation');
  const env = { ...process.env, MONGODB_URI: uri, JWT_SECRET: 'disposable-test-secret', CHAT_ENCRYPTION_KEY: 'disposable-chat-key', ADMIN_EMAIL: 'migration-admin@example.test', ADMIN_PASSWORD: 'Disposable-Admin-839!', SEED_SELLER_PASSWORD: 'Disposable-Seller-839!' };
  try {
    fs.writeFileSync(path.join(output, 'environment.txt'), `Node ${process.version}\nMongoDB 7.0.24\nSingle-node disposable replica set\nDatabase secondsafe_disposable_validation\n`);
    for (const command of ['seed', 'seed:verify', 'db:indexes', 'db:migrate', 'create-admin']) {
      console.log(`Running npm run ${command}`);
      const run = await new Promise((resolve, reject) => { const child = spawn('npm', ['run', command], { cwd: path.join(root, 'backend'), env, timeout: 120000 }); let stdout = ''; let stderr = ''; child.stdout.on('data', data => { stdout += data; }); child.stderr.on('data', data => { stderr += data; }); child.on('error', reject); child.on('close', status => resolve({ stdout, stderr, status })); });
      fs.writeFileSync(path.join(output, `${command.replace(':', '-')}.txt`), `Command: npm run ${command}\n${run.stdout}${run.stderr}\nexit_code=${run.status}\n`);
      if (run.status !== 0) throw new Error(`${command} failed: ${run.stderr || run.stdout}`);
    }
    await mongoose.connect(uri);
    const modules = path.join(root, 'backend/src/modules');
    for (const folder of fs.readdirSync(modules)) {
      for (const file of fs.readdirSync(path.join(modules, folder)).filter(f => f.endsWith('.model.js'))) require(path.join(modules, folder, file));
    }
    const lines = [];
    for (const name of mongoose.modelNames().sort()) {
      const model = mongoose.model(name);
      const actual = await model.collection.indexes();
      for (const [key, options] of model.schema.indexes()) {
        const textFields = Object.entries(key).filter(([, kind]) => kind === 'text').map(([field]) => field).sort();
        const match = actual.find(i => textFields.length ? i.key._fts === 'text' && JSON.stringify(Object.keys(i.weights || {}).sort()) === JSON.stringify(textFields) : JSON.stringify(i.key) === JSON.stringify(key));
        if (!match || Boolean(match.unique) !== Boolean(options.unique)) throw new Error(`Missing/mismatched ${name} index ${JSON.stringify(key)}`);
      }
      lines.push(`${name}: ${model.schema.indexes().length} declared indexes present; ${actual.length} total indexes`);
    }
    fs.writeFileSync(path.join(output, 'index-assertions.txt'), `PASS: all ${mongoose.modelNames().length} models have every declared index\n${lines.join('\n')}\n`);
    const admin = await mongoose.model('User').findOne({ email: env.ADMIN_EMAIL }).select('+password').lean();
    if (!admin || admin.role !== 'admin' || admin.password === env.ADMIN_PASSWORD) throw new Error('Admin seed assertion failed');
    fs.writeFileSync(path.join(output, 'data-assertions.txt'), `PASS: disposable admin exists with admin role and hashed password\nProducts: ${await mongoose.model('Product').countDocuments()}\nCategories: ${await mongoose.model('Category').countDocuments()}\n`);
    console.log('PASS: database scripts, all declared indexes and disposable admin validated');
  } finally {
    await mongoose.disconnect();
    await repl.stop();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
