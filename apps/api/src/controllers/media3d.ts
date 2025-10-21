import { Request, Response } from 'express';
import { validate3DModelFile } from '../services/media/validate3d';
import { upload3DRawToCloudinary } from '../services/storage/cloudinary';

// POST /v1/media/3d/upload
export async function upload3DModel(req: Request, res: Response) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    validate3DModelFile(req.file.originalname, req.file.mimetype, req.file.size);
    // Upload to Cloudinary (or S3)
    const result = await upload3DRawToCloudinary(req.file.buffer, {
      folder: '3d-models',
      public_id: req.file.originalname.replace(/\.[^.]+$/, ''),
      format: req.file.mimetype === 'model/gltf-binary' ? 'glb' : 'gltf',
    });
    res.json({ success: true, url: result.secure_url });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
}
