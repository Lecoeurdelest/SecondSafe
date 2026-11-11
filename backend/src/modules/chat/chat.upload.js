const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// backend/uploads duoc app.js phuc vu tinh tai /uploads.
const UPLOAD_ROOT = path.join(__dirname, '../../../uploads/chat');
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const IMAGE_EXTENSIONS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };

function httpError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode });
}

const storage = multer.diskStorage({
  destination(req, file, callback) {
    // Thu muc theo conversation; id da duoc kiem tra quyen truoc khi toi day.
    const directory = path.join(UPLOAD_ROOT, String(req.chatConversation._id));
    fs.mkdir(directory, { recursive: true }, error => callback(error, directory));
  },
  filename(req, file, callback) {
    callback(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${IMAGE_EXTENSIONS[file.mimetype]}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter(req, file, callback) {
    if (IMAGE_EXTENSIONS[file.mimetype]) return callback(null, true);
    return callback(httpError(400, 'Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF'));
  }
}).single('image');

// Chuyen loi multer thanh loi HTTP de error middleware tra ve dung ma.
function uploadChatImage(req, res, next) {
  upload(req, res, error => {
    if (!error) return next();
    if (error.code === 'LIMIT_FILE_SIZE') return next(httpError(413, 'Ảnh không được vượt quá 20 MB'));
    if (error instanceof multer.MulterError) return next(httpError(400, 'Dữ liệu upload không hợp lệ'));
    return next(error);
  });
}

function publicPath(conversationId, filename) {
  return `/uploads/chat/${conversationId}/${filename}`;
}

module.exports = { uploadChatImage, publicPath, UPLOAD_ROOT, MAX_IMAGE_BYTES };
