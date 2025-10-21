// Utility for uploading 3D models (GLTF/GLB) as raw files
import stream from 'stream';

export async function upload3DRawToCloudinary(buffer: Buffer, opts: { folder: string; public_id: string; format: string }) {
    return new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: opts.folder,
                public_id: opts.public_id,
                resource_type: 'raw',
                format: opts.format,
                overwrite: true,
                use_filename: true,
                unique_filename: false,
            },
            (err, result) => {
                if (err) return reject(err);
                resolve(result);
            }
        );
        const readable = new stream.PassThrough();
        readable.end(buffer);
        readable.pipe(uploadStream);
    });
}
// Cloudinary storage adapter implementing StorageService
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { StorageService, StorageUploadResult } from './types';

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 500; // ms

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const cloudinaryStorage: StorageService = {
    async upload(file, { folder, filename }) {
        let lastErr;
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                const eager = [
                    { width: 320, height: 320, crop: 'fill', format: 'jpg' }, // thumb
                    { format: 'webp' }, // webp main
                ];
                const uploadResult: UploadApiResponse = await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream(
                        {
                            folder,
                            public_id: filename,
                            resource_type: 'image',
                            overwrite: true,
                            use_filename: true,
                            unique_filename: false,
                            eager,
                        },
                        (err, result) => {
                            if (err) return reject(err);
                            resolve(result!);
                        }
                    ).end(file);
                });
                // Eager URLs: thumb = first, webp = second
                const thumbUrl = uploadResult.eager?.[0]?.secure_url || '';
                const webpUrl = uploadResult.eager?.[1]?.secure_url || '';
                return {
                    // url, width, height are included in ...uploadResult below
                    publicId: uploadResult.public_id,
                    thumbUrl,
                    webpUrl,
                    variants: {
                        thumb: thumbUrl,
                        webp: webpUrl,
                    },
                    ...uploadResult,
                    ...uploadResult,
                } as StorageUploadResult;
            } catch (err) {
                lastErr = err;
                await sleep(RETRY_BASE_DELAY * Math.pow(2, attempt));
            }
        }
        throw lastErr;
    },

    async delete(publicId) {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    },

    getUrl(publicId, options = {}) {
        return cloudinary.url(publicId, {
            secure: true,
            transformation: options.variant ? [{ transformation: options.variant }] : undefined,
            width: options.width,
            height: options.height,
            ...options,
        });
    },
};
