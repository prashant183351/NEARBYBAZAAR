import React, { useState } from 'react';
import axios from 'axios';

export default function ProductEdit3DModel() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post('/api/media/3d/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setModelUrl(res.data.url);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h2>Upload 3D Model (GLTF/GLB)</h2>
      <input type="file" accept=".gltf,.glb" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {modelUrl && (
        <div>
          <p>3D Model uploaded! URL: <a href={modelUrl} target="_blank" rel="noopener noreferrer">{modelUrl}</a></p>
        </div>
      )}
    </div>
  );
}
