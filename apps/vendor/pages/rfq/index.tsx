import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Vendor RFQ list page
export default function VendorRFQList() {
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/vendor/rfq').then(r => { setRfqs(r.data.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">RFQs</h1>
      <ul className="space-y-3">
        {rfqs.map(rfq => (
          <li key={rfq._id} className="border rounded p-3">
            <div className="font-semibold">RFQ #{rfq._id}</div>
            <div>Delivery: {rfq.deliveryLocation}</div>
            <a className="text-blue-600 underline" href={`/rfq/${rfq._id}`}>View & Quote</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
