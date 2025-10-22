import path from 'path';

export function validate3DModelFile(
  filename: string,
  mimetype: string,
  size: number,
  maxSizeMB = 20,
) {
  const ext = path.extname(filename).toLowerCase();
  if (!['.gltf', '.glb'].includes(ext)) {
    throw new Error('Only GLTF/GLB 3D model files are allowed');
  }
  if (!['model/gltf-binary', 'model/gltf+json', 'application/octet-stream'].includes(mimetype)) {
    throw new Error('Invalid 3D model MIME type');
  }
  if (size > maxSizeMB * 1024 * 1024) {
    throw new Error(`3D model file too large (max ${maxSizeMB}MB)`);
  }
  return true;
}
