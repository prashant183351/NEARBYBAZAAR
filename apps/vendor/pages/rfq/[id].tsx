import { useState, useEffect } from 'react';
// ...existing code...
import axios from 'axios';
import { useRouter } from 'next/router';

export default function VendorRFQDetail() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const [rfq, setRfq] = useState<any>();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [form, setForm] = useState({
    unitPrice: '',
    minOrderQty: '',
    leadTimeDays: '',
    validUntil: '',
    notes: '',
  });

  useEffect(() => {
    if (!id) return;
    axios.get(`/api/rfq/${id}`).then((r) => setRfq(r.data.data));
    axios.get(`/api/rfq/${id}/quotes`).then((r) => setQuotes(r.data.data || []));
  }, [id]);

  const submitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    await axios.post(`/api/rfq/${id}/quote`, {
      unitPrice: Number(form.unitPrice),
      minOrderQty: form.minOrderQty ? Number(form.minOrderQty) : undefined,
      leadTimeDays: form.leadTimeDays ? Number(form.leadTimeDays) : undefined,
      validUntil: form.validUntil || undefined,
      notes: form.notes || undefined,
    });
    const r = await axios.get(`/api/rfq/${id}/quotes`);
    setQuotes(r.data.data || []);
  };

  if (!rfq) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">RFQ #{rfq._id}</h1>
      <div>Delivery: {rfq.deliveryLocation}</div>
      <div>Needed by: {rfq.neededBy ? new Date(rfq.neededBy).toLocaleDateString() : '-'}</div>

      <form onSubmit={submitQuote} className="border rounded p-4 space-y-3">
        <div>
          <label className="block text-sm font-semibold">Unit Price (₹)</label>
          <input
            className="border p-2 w-60"
            value={form.unitPrice}
            onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold">Minimum Order Qty</label>
          <input
            className="border p-2 w-60"
            value={form.minOrderQty}
            onChange={(e) => setForm({ ...form, minOrderQty: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold">Lead Time (days)</label>
          <input
            className="border p-2 w-60"
            value={form.leadTimeDays}
            onChange={(e) => setForm({ ...form, leadTimeDays: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold">Valid Until</label>
          <input
            type="date"
            className="border p-2 w-60"
            value={form.validUntil}
            onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold">Notes</label>
          <textarea
            className="border p-2 w-full"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">
          Submit Quote
        </button>
      </form>

      <div>
        <h2 className="text-lg font-semibold mb-2">Quotes</h2>
        <ul className="space-y-2">
          {quotes.map((q) => (
            <li key={q._id} className="border rounded p-3">
              <div>Vendor: {q.vendor?.name || q.vendor}</div>
              <div>Price: ₹{q.unitPrice}</div>
              <div>MOQ: {q.minOrderQty || '-'}</div>
              <div>Lead Time: {q.leadTimeDays || '-'} days</div>
              <div>Status: {q.status}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
