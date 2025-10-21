// Storage service types for cloud uploads/management

export interface StorageUploadResult {
    url: string;
    publicId: string;
    width?: number;
    height?: number;
    [key: string]: any;
}

export interface StorageService {
    upload(file: Buffer, options: {
        folder?: string;
        filename?: string;
        contentType?: string;
        variants?: string[];
    }): Promise<StorageUploadResult>;

    delete(publicId: string): Promise<void>;

    getUrl(publicId: string, options?: {
        variant?: string;
        width?: number;
        height?: number;
        [key: string]: any;
    }): string;
}
