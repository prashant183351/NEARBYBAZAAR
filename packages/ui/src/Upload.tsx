import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { applyWatermark, WatermarkOptions } from '@nearbybazaar/lib/src/watermark.client';

interface UploadProps {
    onFiles: (files: File[]) => void;
    maxFiles?: number;
    accept?: string[];
    watermarkOptions?: WatermarkOptions;
    label?: string;
}

export const Upload: React.FC<UploadProps> = ({
    onFiles,
    maxFiles = 1,
    accept = ['image/jpeg', 'image/png'],
    watermarkOptions,
    label = 'Upload files',
}) => {
    const [previews, setPreviews] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState<number[]>([]);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setUploading(true);
        setProgress(Array(acceptedFiles.length).fill(0));
        const previewUrls: string[] = [];
        const processedFiles: File[] = [];
        for (let i = 0; i < acceptedFiles.length; i++) {
            let file = acceptedFiles[i];
            let url = '';
            if (file.type.startsWith('image/')) {
                // Apply watermark if options provided
                if (watermarkOptions) {
                    const canvas = await applyWatermark(file, watermarkOptions);
                    url = canvas.toDataURL(file.type);
                    // Convert canvas to File
                    const blob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), file.type));
                    file = new File([blob], file.name, { type: file.type });
                } else {
                    url = URL.createObjectURL(file);
                }
            }
            previewUrls.push(url);
            processedFiles.push(file);
            setProgress(p => {
                const next = [...p];
                next[i] = 100;
                return next;
            });
        }
        setPreviews(previewUrls);
        setUploading(false);
        onFiles(processedFiles);
    }, [onFiles, watermarkOptions]);

    const {
        getRootProps,
        getInputProps,
        isDragActive,
        open,
    } = useDropzone({
        onDrop,
        accept: accept.reduce((acc, type) => { acc[type] = []; return acc; }, {} as any),
        maxFiles,
        noClick: true,
        noKeyboard: false,
    });

    return (
        <div {...getRootProps()} tabIndex={0} aria-label={label} className="upload-dropzone" style={{ border: '2px dashed #aaa', padding: 24, borderRadius: 8, outline: isDragActive ? '2px solid #0070f3' : undefined }}>
            <input {...getInputProps()} />
            <div style={{ marginBottom: 12 }}>
                <button type="button" onClick={open} disabled={uploading} aria-label={label}>
                    {label}
                </button>
            </div>
            {previews.length > 0 && (
                <div className="upload-previews" style={{ display: 'flex', gap: 12 }}>
                    {previews.map((src, i) => (
                        <div key={i} style={{ position: 'relative' }}>
                            <img src={src} alt={`Preview ${i + 1}`} style={{ maxWidth: 120, maxHeight: 120, borderRadius: 4 }} />
                            {uploading && <progress value={progress[i] || 0} max={100} style={{ width: '100%' }} />}
                        </div>
                    ))}
                </div>
            )}
            <div style={{ marginTop: 8, color: '#666', fontSize: 13 }}>
                {isDragActive ? 'Drop files here...' : `Drag & drop or click to select (max ${maxFiles} files)`}
            </div>
        </div>
    );
};
