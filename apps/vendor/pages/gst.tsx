import React, { useState } from 'react';
import axios from 'axios';

export default function VendorGSTCompliance() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      // Replace with real API endpoint for invoice export
      const res = await axios.get('/api/invoices/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'invoices-gst.zip');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <h2>GST Compliance & Invoice Download</h2>
      <p>
        Download all your invoices for GST filing. For e-invoice auto-upload, ensure your GSTIN is updated in your profile.
        For more info, see <a href="https://www.gst.gov.in/" target="_blank" rel="noopener noreferrer">GSTN Portal</a>.
      </p>
      <button onClick={handleDownload} disabled={downloading}>
        {downloading ? 'Preparing...' : 'Download All Invoices (ZIP)'}
      </button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
}
