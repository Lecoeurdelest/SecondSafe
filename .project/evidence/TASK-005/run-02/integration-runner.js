const fs = require('fs');
const path = require('path');
const { MongoMemoryReplSet } = require('/tmp/secondsafe-mongo/node_modules/mongodb-memory-server');
const root = '/Users/quyn28654/Documents/ChatGPT/wdp/SecondSafe';
const runtime = name => require(path.join(root, 'backend/node_modules', name));
const mongoose = runtime('mongoose');
const express = runtime('express');
const request = runtime('supertest');
const bcrypt = runtime('bcryptjs');
const jwt = runtime('jsonwebtoken');
process.env.JWT_SECRET = 'disposable-auth-integration-secret';
const User = require(path.join(root, 'backend/src/modules/users/user.model'));
const { authenticate, optionalAuthenticate } = require(path.join(root, 'backend/src/common/middlewares/auth.middleware'));
const { requireRole } = require(path.join(root, 'backend/src/common/middlewares/role.middleware'));
const { generateJWT } = require(path.join(root, 'backend/src/common/utils/jwt.util'));
const { errorHandler } = require(path.join(root, 'backend/src/common/middlewares/error.middleware'));
const output = path.join(root, '.project/evidence/TASK-005/run-02');
fs.mkdirSync(output, { recursive: true });

async function main() {
  const server = await MongoMemoryReplSet.create({ binary: { version: '7.0.24' }, replSet: { count: 1 } });
  const transcript = [];
  try {
    await mongoose.connect(server.getUri('secondsafe_disposable_auth'));
    const password = await bcrypt.hash('Disposable-Only-938!', 10);
    const users = {};
    for (const role of ['user', 'moderator', 'admin']) users[role] = await User.create({ email: `${role}@example.test`, fullName: 'Disposable Account', password, role });
    const app = express();
    app.get('/protected', authenticate, (req, res) => res.json(req.user));
    app.get('/moderator', authenticate, requireRole('moderator'), (req, res) => res.sendStatus(204));
    app.get('/admin', authenticate, requireRole('admin'), (req, res) => res.sendStatus(204));
    app.get('/optional', optionalAuthenticate, (req, res) => res.json({ role: req.user?.role || 'guest' }));
    app.use(errorHandler);
    for (const [role, user] of Object.entries(users)) {
      for (const [route, expected] of [['/protected', 200], ['/moderator', role === 'user' ? 403 : 204], ['/admin', role === 'admin' ? 204 : 403]]) {
        const response = await request(app).get(route).set('Authorization', `Bearer ${generateJWT({ userId: user._id })}`);
        transcript.push({ role, route, expected, actual: response.status, body: response.body });
        if (response.status !== expected || response.body.password) throw new Error(`Failed ${role} ${route}`);
      }
    }
    const elevatedClaim = jwt.sign({ userId: String(users.user._id), role: 'admin' }, process.env.JWT_SECRET, { expiresIn: 60 });
    const denied = await request(app).get('/admin').set('Authorization', `Bearer ${elevatedClaim}`);
    transcript.push({ case: 'JWT role claim cannot override database role', expected: 403, actual: denied.status });
    if (denied.status !== 403) throw new Error('Token claim escalated role');
    const expired = await request(app).get('/protected').set('Authorization', `Bearer ${generateJWT({ userId: users.user._id }, -1)}`);
    transcript.push({ case: 'expired token', expected: 401, actual: expired.status });
    if (expired.status !== 401) throw new Error('Expired token accepted');
    const token = generateJWT({ userId: users.user._id });
    await User.deleteOne({ _id: users.user._id });
    const removed = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);
    transcript.push({ case: 'deleted database account', expected: 401, actual: removed.status });
    if (removed.status !== 401) throw new Error('Deleted account accepted');
    fs.writeFileSync(path.join(output, 'http-transcript.json'), JSON.stringify(transcript, null, 2) + '\n');
    console.log(`PASS: ${transcript.length} JWT/role HTTP assertions against real MongoDB 7.0.24 replica set; passwords excluded`);
  } finally {
    await mongoose.disconnect();
    await server.stop();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
