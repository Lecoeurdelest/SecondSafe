const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const UPLOAD_ROOT = path.join(__dirname, '../../../uploads');
const TEMP_TARGET = 'temp';
const SIGNATURE_BYTES = 12;

// Each allowed extension names the file signature its content must carry.
const PRODUCT_IMAGES = Object.freeze({
  bucket: 'products',
  maxBytes: 5 * 1024 * 1024,
  maxFiles: 5,
  types: Object.freeze({ jpg: 'jpeg', jpeg: 'jpeg', png: 'png', gif: 'gif' })
});

const EVIDENCE = Object.freeze({
  bucket: 'evidence',
  maxBytes: 100 * 1024 * 1024,
  maxFiles: 5,
  types: Object.freeze({ jpg: 'jpeg', jpeg: 'jpeg', png: 'png', mp4: 'mp4' })
});

const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const SIGNATURES = Object.freeze({
  jpeg: bytes => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  png: bytes => bytes.subarray(0, PNG_HEADER.length).equals(PNG_HEADER),
  gif: bytes => ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString('latin1')),
  mp4: bytes => bytes.subarray(4, 8).toString('latin1') === 'ftyp'
});

function httpError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode });
}

function extensionOf(file) {
  return path.extname(file.originalname || '').slice(1).toLowerCase();
}

function allowedList(profile) {
  return Object.keys(profile.types).map(extension => extension.toUpperCase()).join(', ');
}

// The target becomes a directory name, so only an ObjectId or the shared temp folder is accepted.
function uploadTarget(req) {
  const value = req.query.productId || req.query.targetId;
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value) ? value.toLowerCase() : TEMP_TARGET;
}

function createStorage(profile) {
  return multer.diskStorage({
    destination(req, file, callback) {
      req.uploadTargetId = uploadTarget(req);
      const directory = path.join(UPLOAD_ROOT, profile.bucket, req.uploadTargetId);
      fs.mkdir(directory, { recursive: true }, error => callback(error, directory));
    },
    filename(req, file, callback) {
      callback(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${extensionOf(file)}`);
    }
  });
}

function createUpload(profile) {
  return multer({
    storage: createStorage(profile),
    limits: { fileSize: profile.maxBytes, files: profile.maxFiles },
    fileFilter(req, file, callback) {
      if (profile.types[extensionOf(file)]) return callback(null, true);
      return callback(httpError(400, `Định dạng file không hợp lệ. Chỉ chấp nhận: ${allowedList(profile)}`));
    }
  });
}

function uploadErrorMessage(error) {
  if (error.code === 'LIMIT_FILE_SIZE') return 'Kích thước file vượt quá giới hạn cho phép';
  if (['LIMIT_FILE_COUNT', 'LIMIT_UNEXPECTED_FILE'].includes(error.code)) return 'Số lượng file vượt quá giới hạn cho phép';
  return 'Dữ liệu upload không hợp lệ';
}

async function readSignature(filePath) {
  const handle = await fs.promises.open(filePath, 'r');
  try {
    const { buffer, bytesRead } = await handle.read(Buffer.alloc(SIGNATURE_BYTES), 0, SIGNATURE_BYTES, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

function storedFiles(req) {
  return req.files || (req.file ? [req.file] : []);
}

// NFR-SEC-09: the extension alone is not trusted; the stored bytes must carry the matching signature.
async function verifySignatures(req, profile) {
  const files = storedFiles(req);
  const checks = await Promise.all(files.map(async file => {
    const signature = SIGNATURES[profile.types[extensionOf(file)]];
    return signature(await readSignature(file.path));
  }));
  if (checks.every(Boolean)) return;
  await Promise.all(files.map(file => fs.promises.unlink(file.path).catch(() => {})));
  throw httpError(400, `Nội dung file không khớp với định dạng. Chỉ chấp nhận: ${allowedList(profile)}`);
}

// Wraps a multer handler so its failures and the signature check reach the error middleware as HTTP errors.
function handled(middleware, profile) {
  return (req, res, next) => middleware(req, res, error => {
    if (error instanceof multer.MulterError) return next(httpError(400, uploadErrorMessage(error)));
    if (error) return next(error);
    return verifySignatures(req, profile).then(() => next(), next);
  });
}

function publicPath(bucket, targetId, filename) {
  return `/uploads/${bucket}/${targetId}/${filename}`;
}

const productUpload = createUpload(PRODUCT_IMAGES);
const evidenceUpload = createUpload(EVIDENCE);

module.exports = {
  uploadProductImage: handled(productUpload.single('image'), PRODUCT_IMAGES),
  uploadProductImages: handled(productUpload.array('images', PRODUCT_IMAGES.maxFiles), PRODUCT_IMAGES),
  uploadEvidenceFiles: handled(evidenceUpload.array('files', EVIDENCE.maxFiles), EVIDENCE),
  publicPath,
  uploadTarget,
  PRODUCT_IMAGES,
  EVIDENCE,
  SIGNATURES
};
