import { Router } from 'express';
import multer from 'multer';
import { upload3DModel } from '../controllers/media3d';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

// POST /v1/media/3d/upload
router.post('/upload', upload.single('file'), upload3DModel);

export default router;
