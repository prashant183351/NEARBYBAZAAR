import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { validateFile } from '../services/media';

// Configure multer for memory storage (process in-memory before uploading to cloud)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: Number(process.env.MAX_UPLOAD_SIZE_MB || 10) * 1024 * 1024,
        files: Number(process.env.MAX_FILES_PER_UPLOAD || 10),
    },
    fileFilter: (_req: any, file: any, cb: any) => {
        const validation = validateFile(0, file.mimetype); // Size checked by limits
        if (!validation.valid) {
            return cb(new Error(validation.error));
        }
        cb(null, true);
    },
});

/**
 * Middleware to handle single file upload
 */
export const uploadSingle = upload.single('file');

/**
 * Middleware to handle multiple file uploads
 */
export const uploadMultiple = upload.array('files', Number(process.env.MAX_FILES_PER_UPLOAD || 10));

/**
 * Error handling middleware for multer errors
 */
export function handleUploadError(err: any, _req: Request, res: Response, next: NextFunction) {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                success: false,
                error: {
                    code: 'FILE_TOO_LARGE',
                    message: `File size exceeds maximum of ${process.env.MAX_UPLOAD_SIZE_MB || 10}MB`,
                },
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'TOO_MANY_FILES',
                    message: `Maximum ${process.env.MAX_FILES_PER_UPLOAD || 10} files allowed`,
                },
            });
        }
        return res.status(400).json({
            success: false,
            error: {
                code: 'UPLOAD_ERROR',
                message: err.message,
            },
        });
    }

    if (err) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'UPLOAD_ERROR',
                message: err.message || 'File upload failed',
            },
        });
    }

    next();
}

/**
 * Timeout protection middleware for uploads
 */
export function uploadTimeout(timeoutMs: number = 60000) {
    return (_req: Request, res: Response, next: NextFunction) => {
        const timeout = setTimeout(() => {
            if (!res.headersSent) {
                res.status(408).json({
                    success: false,
                    error: {
                        code: 'UPLOAD_TIMEOUT',
                        message: 'Upload timeout exceeded',
                    },
                });
            }
        }, timeoutMs);

        res.on('finish', () => clearTimeout(timeout));
        res.on('close', () => clearTimeout(timeout));

        next();
    };
}

/**
 * Validate uploaded file middleware
 */
export function validateUpload(req: Request, res: Response, next: NextFunction) {
    const file = (req as any).file;
    const files = (req as any).files;

    if (!file && (!files || files.length === 0)) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'NO_FILE',
                message: 'No file uploaded',
            },
        });
    }

    // Validate each file
    const filesToValidate = files || [file];
    for (const f of filesToValidate) {
        const validation = validateFile(f.size, f.mimetype);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_FILE',
                    message: validation.error,
                },
            });
        }
    }

    next();
}
