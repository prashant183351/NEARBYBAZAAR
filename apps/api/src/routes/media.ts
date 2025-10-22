import { Router } from 'express';
import * as media from '../controllers/media';
import {
  uploadSingle,
  handleUploadError,
  uploadTimeout,
  validateUpload,
} from '../middleware/upload';

const router = Router();

router.get('/', media.listMedia);
router.get('/:id', media.getMedia);
router.post('/', media.createMedia);
router.delete('/:id', media.deleteMedia);

// Legacy signature endpoint (consider deprecating in favor of presigned)
router.get('/upload/signature', media.getUploadSignature);

// Presigned upload URL generation (recommended for direct client uploads)
router.post('/presigned', media.getPresignedUpload);

// Direct file upload with security pipeline
router.post(
  '/upload',
  uploadTimeout(60000), // 60 second timeout
  uploadSingle,
  handleUploadError,
  validateUpload,
  media.uploadMedia,
);

export default router;
