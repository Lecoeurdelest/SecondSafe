const { publicPath, PRODUCT_IMAGES, EVIDENCE } = require('../../common/middlewares/upload.middleware');
const { sendSuccess, sendError } = require('../../common/utils/response.util');

function describe(bucket, req, file) {
  return {
    filename: file.filename,
    path: publicPath(bucket, req.uploadTargetId, file.filename),
    size: file.size,
    mimetype: file.mimetype
  };
}

function uploadImage(req, res) {
  if (!req.file) return sendError(res, 400, 'Vui lòng chọn file để upload');
  return sendSuccess(res, 200, describe(PRODUCT_IMAGES.bucket, req, req.file), 'Upload thành công');
}

function uploadImages(req, res) {
  if (!req.files?.length) return sendError(res, 400, 'Vui lòng chọn ít nhất một file để upload');
  return sendSuccess(res, 200, req.files.map(file => describe(PRODUCT_IMAGES.bucket, req, file)), 'Upload thành công');
}

function uploadEvidence(req, res) {
  if (!req.files?.length) return sendError(res, 400, 'Vui lòng chọn ít nhất một file để upload');
  return sendSuccess(res, 200, req.files.map(file => describe(EVIDENCE.bucket, req, file)), 'Upload bằng chứng thành công');
}

module.exports = { uploadImage, uploadImages, uploadEvidence };
