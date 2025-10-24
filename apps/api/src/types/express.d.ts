// Extend Express Request type to include file property from multer
import 'express';
import { File as MulterFile } from 'multer';

declare module 'express-serve-static-core' {
  interface Request {
    file?: MulterFile & { buffer: Buffer };
  }
}
