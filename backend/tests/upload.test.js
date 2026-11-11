const fs = require('fs');
const path = require('path');
const express = require('express');
const request = require('supertest');

let mockUser = null;
jest.mock('../src/common/middlewares/auth.middleware', () => ({
  authenticate: (req, res, next) => {
    if (!mockUser) return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });
    req.user = mockUser;
    return next();
  }
}));

const uploadRoutes = require('../src/modules/products/upload.route');
const { errorHandler } = require('../src/common/middlewares/error.middleware');
const { uploadTarget } = require('../src/common/middlewares/upload.middleware');
const logger = require('../src/common/utils/logger.util');

const UPLOADS = path.join(__dirname, '../uploads');
const TARGET_ID = '507f1f77bcf86cd799439011';
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
const GIF = Buffer.from('GIF89a000000', 'latin1');
const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypisom', 'latin1')]);

const app = express();
app.use('/api/upload', uploadRoutes);
app.use(errorHandler);

const existedBefore = ['products/temp', 'evidence/temp'].filter(dir => fs.existsSync(path.join(UPLOADS, dir)));
const created = [];

function remember(response) {
  const files = Array.isArray(response.body.data) ? response.body.data : [response.body.data].filter(Boolean);
  created.push(...files.map(file => path.join(UPLOADS, '..', file.path)));
  return files;
}

function filesIn(dir) {
  const full = path.join(UPLOADS, dir);
  return fs.existsSync(full) ? fs.readdirSync(full) : [];
}

beforeEach(() => {
  mockUser = { userId: 'user-1', role: 'user' };
  jest.spyOn(logger, 'error').mockImplementation(() => {});
});

afterAll(() => {
  created.forEach(file => fs.rmSync(file, { force: true }));
  fs.rmSync(path.join(UPLOADS, 'products', TARGET_ID), { recursive: true, force: true });
  for (const dir of ['products/temp', 'evidence/temp']) {
    const full = path.join(UPLOADS, dir);
    if (!existedBefore.includes(dir) && fs.existsSync(full) && !fs.readdirSync(full).length) fs.rmdirSync(full);
  }
});

test('uploads require authentication', async () => {
  mockUser = null;
  const response = await request(app).post('/api/upload/images').attach('images', PNG, 'a.png');
  expect(response.status).toBe(401);
});

test('product images accept jpg, jpeg, png and gif under random names (AC-PROD-02-1)', async () => {
  const response = await request(app).post('/api/upload/images')
    .attach('images', JPEG, 'a.jpg').attach('images', JPEG, 'b.JPEG').attach('images', PNG, 'c.png').attach('images', GIF, 'd.gif');

  expect(response.status).toBe(200);
  const files = remember(response);
  expect(files).toHaveLength(4);
  for (const file of files) {
    expect(file.path).toMatch(/^\/uploads\/products\/temp\/\d+-[a-f\d]{16}\.(jpg|jpeg|png|gif)$/);
    expect(fs.existsSync(path.join(UPLOADS, '..', file.path))).toBe(true);
  }
  expect(new Set(files.map(file => file.filename)).size).toBe(4);
});

test('a single product image is stored the same way', async () => {
  const response = await request(app).post(`/api/upload/image?productId=${TARGET_ID}`).attach('image', PNG, 'cover.png');
  expect(response.status).toBe(200);
  expect(remember(response)[0].path).toMatch(new RegExp(`^/uploads/products/${TARGET_ID}/`));
});

test('more than five files, an unknown extension or an oversized image are rejected with 400', async () => {
  let upload = request(app).post('/api/upload/images');
  for (let index = 0; index < 6; index += 1) upload = upload.attach('images', PNG, `${index}.png`);
  expect((await upload).status).toBe(400);

  for (const name of ['photo.webp', 'tool.exe', 'noextension']) {
    expect((await request(app).post('/api/upload/images').attach('images', PNG, name)).status).toBe(400);
  }

  const oversized = Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)]);
  const response = await request(app).post('/api/upload/images').attach('images', oversized, 'big.png');
  expect(response.status).toBe(400);
  expect(response.body.message).toBe('Kích thước file vượt quá giới hạn cho phép');
});

test('content that does not match the extension is rejected and removed (AC-NFR-SEC-09-1)', async () => {
  const before = filesIn('products/temp').length;
  const response = await request(app).post('/api/upload/images')
    .attach('images', PNG, 'real.png').attach('images', Buffer.from('<script>alert(1)</script>'), 'fake.png');

  expect(response.status).toBe(400);
  expect(response.body.message).toMatch(/Nội dung file không khớp/);
  expect(filesIn('products/temp')).toHaveLength(before);
  expect((await request(app).post('/api/upload/images').attach('images', GIF, 'renamed.jpg')).status).toBe(400);
});

test('evidence accepts jpg, jpeg, png and mp4 only (AC-RPT-05-1)', async () => {
  const accepted = await request(app).post('/api/upload/evidence')
    .attach('files', PNG, 'proof.png').attach('files', JPEG, 'proof.jpg').attach('files', MP4, 'clip.mp4');
  expect(accepted.status).toBe(200);
  expect(remember(accepted).map(file => path.extname(file.path))).toEqual(['.png', '.jpg', '.mp4']);
  expect(accepted.body.data[0].path).toMatch(/^\/uploads\/evidence\/temp\//);

  expect((await request(app).post('/api/upload/evidence').attach('files', GIF, 'anim.gif')).status).toBe(400);
  expect((await request(app).post('/api/upload/evidence').attach('files', PNG, 'clip.mp4')).status).toBe(400);
  expect((await request(app).post('/api/upload/evidence')).status).toBe(400);
});

test('the upload target can only be an object id, never a path', () => {
  expect(uploadTarget({ query: { productId: '../../etc' } })).toBe('temp');
  expect(uploadTarget({ query: { targetId: ['a', 'b'] } })).toBe('temp');
  expect(uploadTarget({ query: { targetId: TARGET_ID.toUpperCase() } })).toBe(TARGET_ID);
});
