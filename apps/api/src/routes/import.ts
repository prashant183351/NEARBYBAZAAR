import { Router } from 'express';
import { importCsv } from '../controllers/import';
import multer from 'multer';

const upload = multer();
const router = Router();

router.post('/csv', upload.single('file'), importCsv);

export default router;
