const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const { authenticate } = require('../../common/middlewares/auth.middleware');
const { requireSellerCanSell } = require('../../common/middlewares/seller-restriction.middleware');
const { sendSuccess, sendError } = require('../../common/utils/response.util');

const UPLOAD_ROOT = path.join(__dirname, '../../../uploads/products');
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMAGE_EXTENSIONS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };

const storage = multer.diskStorage({
  destination(req, file, callback) {
    const directory = path.join(UPLOAD_ROOT, String(req.user.userId));
    fs.mkdir(directory, { recursive: true }, error => callback(error, directory));
  },
  filename(req, file, callback) {
    callback(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${IMAGE_EXTENSIONS[file.mimetype]}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_BYTES, files: 6 },
  fileFilter(req, file, callback) {
    if (IMAGE_EXTENSIONS[file.mimetype]) return callback(null, true);
    return callback(Object.assign(new Error('Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF'), { statusCode: 400 }), false);
  }
}).array('images', 6);

function uploadProductImages(req, res, next) {
  upload(req, res, error => {
    if (!error) return next();
    if (error.code === 'LIMIT_FILE_SIZE') return next(Object.assign(new Error('Ảnh không được vượt quá 10 MB'), { statusCode: 413 }));
    if (error instanceof multer.MulterError) return next(Object.assign(new Error('Dữ liệu ảnh không hợp lệ'), { statusCode: 400 }));
    return next(error);
  });
}

const router = express.Router();
router.post('/product', authenticate, requireSellerCanSell, uploadProductImages, (req, res) => {
  if (!req.files?.length) return sendError(res, 400, 'Vui lòng chọn ít nhất một ảnh');
  return sendSuccess(res, 200, {
    imageUrls: req.files.map(file => `/uploads/products/${req.user.userId}/${file.filename}`)
  }, 'Upload ảnh sản phẩm thành công');
});

module.exports = router;
