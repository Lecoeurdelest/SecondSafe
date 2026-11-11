const express = require('express');
const controller = require('./upload.controller');
const { authenticate } = require('../../common/middlewares/auth.middleware');
const { uploadProductImage, uploadProductImages, uploadEvidenceFiles } = require('../../common/middlewares/upload.middleware');

const router = express.Router();

router.use(authenticate);
router.post('/image', uploadProductImage, controller.uploadImage);
router.post('/images', uploadProductImages, controller.uploadImages);
router.post('/evidence', uploadEvidenceFiles, controller.uploadEvidence);

module.exports = router;
