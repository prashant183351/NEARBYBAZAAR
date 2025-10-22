import React, { useState } from 'react';

export default function ManualERPSyncPage() {
  const [status, setStatus] = useState<'idle' | 'triggered' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // TODO: Replace with actual vendorId and permission check
  const vendorId = 'demo-vendor-id';
  const isAuthorized = true; // Replace with real auth logic

  const handleSync = async () => {
    setStatus('idle');
    setMessage('');
    try {
      const res = await fetch(`/api/erp/sync-now?vendorId=${vendorId}`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to trigger sync');
      setStatus('triggered');
      setMessage('Sync job triggered!');
    } catch (err: any) {
      setStatus('error');
      setMessage('Error triggering sync');
    }
  };

  if (!isAuthorized) return <div>Not authorized.</div>;

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: 32 }}>
      <h2>Manual ERP Sync</h2>
      <button onClick={handleSync} disabled={status === 'triggered'}>
        Trigger Sync Now
      </button>
      {message && (
        <div style={{ marginTop: 16, color: status === 'error' ? 'red' : 'green' }}>{message}</div>
      )}
      {/* TODO: Optionally poll for job completion or listen for webhook */}
    </div>
  );
}
