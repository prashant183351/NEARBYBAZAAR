import { useState, useEffect } from 'react';
// ...existing code...
import Script from 'next/script';
import { getClientFingerprint } from '../../lib/fingerprint';
import axios from 'axios';
import { useRouter } from 'next/router';

export default function BuyerRFQDetail() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const [rfq, setRfq] = useState<any>();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!id) return;
    axios.get(`/api/rfq/${id}`).then((r) => setRfq(r.data.data));
    axios.get(`/api/rfq/${id}/quotes`).then((r) => setQuotes(r.data.data || []));
  }, [id]);

  const postMessage = async (quoteId: string) => {
    if (!message) return;
    const siteKey =
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || (window as any).NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    // @ts-ignore
    if (!window.grecaptcha) {
      alert('reCAPTCHA not loaded');
      return;
    }
    // @ts-ignore
    const token = await window.grecaptcha.execute(siteKey, { action: 'rfq_message' });
    const fingerprint = getClientFingerprint();
    await axios.post(`/api/rfq/quotes/${quoteId}/messages`, {
      message,
      authorType: 'buyer',
      recaptchaToken: token,
      fingerprint,
    });
    setMessage('');
  };

  const accept = async (quoteId: string) => {
    await axios.put(`/api/rfq/quotes/${quoteId}/accept`);
    const r = await axios.get(`/api/rfq/${id}/quotes`);
    setQuotes(r.data.data || []);
  };

  if (!rfq) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-4">
      <Script
        src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
        strategy="afterInteractive"
      />
      <h1 className="text-xl font-bold">RFQ #{rfq._id}</h1>
      <div>Delivery: {rfq.deliveryLocation}</div>
      <div>Needed by: {rfq.neededBy ? new Date(rfq.neededBy).toLocaleDateString() : '-'}</div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Quotes</h2>
        <ul className="space-y-2">
          {quotes.map((q) => (
            <li key={q._id} className="border rounded p-3">
              <div>Vendor: {q.vendor?.name || q.vendor}</div>
              <div>Price: {q.unitPrice}</div>
              <div>MOQ: {q.minOrderQty || '-'}</div>
              <div>Lead Time: {q.leadTimeDays || '-'} days</div>
              <div>Status: {q.status}</div>
              <div className="mt-2 flex gap-2">
                <input
                  className="border p-2 flex-1"
                  placeholder="Message to vendor"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <button
                  className="bg-gray-700 text-white px-3 py-2 rounded"
                  onClick={() => postMessage(q._id)}
                >
                  Send
                </button>
                {q.status !== 'accepted' && (
                  <button
                    className="bg-green-600 text-white px-3 py-2 rounded"
                    onClick={() => accept(q._id)}
                  >
                    Accept
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
