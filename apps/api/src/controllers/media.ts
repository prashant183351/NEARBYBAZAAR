import { Request, Response } from 'express';
import { Media, MediaZ } from '../models/Media';
import cloudinary from 'cloudinary';
import { generatePresignedUpload, processUploadedFile, withUploadTimeout } from '../services/media';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function listMedia(_req: Request, res: Response) {
  const media = await Media.find({ deleted: false });
  res.json({ media });
}

export async function getMedia(req: Request, res: Response) {
  const media = await Media.findById(req.params.id);
  if (!media || media.deleted) return res.status(404).json({ error: 'Not found' });
  res.json({ media });
}

export async function createMedia(req: Request, res: Response) {
  // Support single or multiple media objects
  const items = Array.isArray(req.body) ? req.body : [req.body];
  const errors: any[] = [];
  const valid: any[] = [];
  for (const item of items) {
    const parse = MediaZ.safeParse(item);
    if (!parse.success) {
      errors.push({ index: valid.length + errors.length, errors: parse.error.issues });
      continue;
    }
    // Enforce alt text presence (and prepare for i18n alt text)
    if (!parse.data.alt || typeof parse.data.alt !== 'string' || !parse.data.alt.trim()) {
      errors.push({
        index: valid.length + errors.length,
        errors: [{ message: 'Alt text is required', path: ['alt'] }],
      });
      continue;
    }
    valid.push(parse.data);
  }
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });
  const media = await Media.create(valid);
  res.status(201).json({ media });
}

export async function deleteMedia(req: Request, res: Response) {
  const media = await Media.findByIdAndUpdate(req.params.id, { deleted: true }, { new: true });
  if (!media) return res.status(404).json({ error: 'Not found' });
  res.json({ media });
}

// Stub: Generate a Cloudinary upload signature/token
export async function getUploadSignature(_req: Request, res: Response) {
  // TODO: Add authentication and user context
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.v2.utils.api_sign_request(
    { timestamp },
    process.env.CLOUDINARY_API_SECRET!,
  );
  res.json({
    timestamp,
    signature,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  });
}

/**
 * Generate presigned upload URL for direct client uploads
 * POST /v1/media/presigned
 */
export async function getPresignedUpload(req: Request, res: Response) {
  try {
    const { filename, contentType, size, folder } = req.body;

    if (!filename || !contentType || !size) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'filename, contentType, and size are required',
        },
      });
    }

    const result = await generatePresignedUpload({
      filename,
      contentType,
      size: Number(size),
      folder,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'PRESIGNED_UPLOAD_FAILED',
        message: error.message || 'Failed to generate presigned upload',
      },
    });
  }
}

/**
 * Upload and process media file
 * POST /v1/media/upload
 * Expects multipart/form-data with 'file' field
 */
export async function uploadMedia(req: Request, res: Response) {
  try {
    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'No file uploaded',
        },
      });
    }

    // Get alt text from form data
    const alt = req.body.alt;
    if (!alt || typeof alt !== 'string' || !alt.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALT_TEXT_REQUIRED',
          message: 'Alt text is required for accessibility',
        },
      });
    }

    // Process file with timeout protection
    const result = await withUploadTimeout(
      processUploadedFile(file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
        folder: req.body.folder || 'uploads',
        generateVariants: true,
      }),
      60000, // 60 second timeout
    );

    // Create media record
    const media = await Media.create({
      cloudinaryId: result.publicId,
      url: result.url,
      alt: alt.trim(),
      exifStripped: result.metadata.exifStripped,
      uploadedBy: (req as any).user?.id,
      thumbUrl: result.variants.thumb,
      webpUrl: result.variants.webp,
      variants: result.variants,
    });

    res.status(201).json({
      success: true,
      data: {
        media,
        processing: result.metadata,
      },
    });
  } catch (error: any) {
    // Check for virus detection
    if (error.message?.includes('Virus detected')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'VIRUS_DETECTED',
          message: error.message,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_FAILED',
        message: error.message || 'File upload failed',
      },
    });
  }
}
