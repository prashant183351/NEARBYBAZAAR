import { useState } from 'react';
import Script from 'next/script';
import axios from 'axios';
import { getClientFingerprint } from '../../lib/fingerprint';

export default function B2BRegister() {
  const [form, setForm] = useState({ companyName: '', gstin: '', pan: '', address: '' });
  const [status, setStatus] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    try {
      // Get reCAPTCHA token
      const siteKey =
        process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
        (window as any).NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
      if (!siteKey) {
        setStatus('reCAPTCHA site key missing');
        return;
      }
      // @ts-ignore
      if (!window.grecaptcha) {
        setStatus('reCAPTCHA not loaded');
        return;
      }
      // @ts-ignore
      const token = await window.grecaptcha.execute(siteKey, { action: 'b2b_register' });
      const fingerprint = await getClientFingerprint();
      const r = await axios.post('/api/b2b/register', {
        ...form,
        recaptchaToken: token,
        fingerprint,
      });
      if (r.data?.success) setStatus('Business profile saved.');
      else setStatus(r.data?.error || 'Failed');
    } catch (e: any) {
      setStatus(e?.response?.data?.error || e.message);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: '2rem auto', padding: '1rem' }}>
      <Script
        src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
        strategy="afterInteractive"
      />
      <h1>B2B Registration</h1>
      <p>Upgrade your account to access wholesale-only products, RFQ, and bulk pricing.</p>
      <form onSubmit={submit}>
        <label>
          Company Name
          <input
            type="text"
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            required
          />
        </label>
        <br />
        <label>
          GSTIN (optional)
          <input
            type="text"
            value={form.gstin}
            onChange={(e) => setForm({ ...form, gstin: e.target.value })}
          />
        </label>
        <br />
        <label>
          PAN (optional)
          <input
            type="text"
            value={form.pan}
            onChange={(e) => setForm({ ...form, pan: e.target.value })}
          />
        </label>
        <br />
        <label>
          Business Address (optional)
          <textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </label>
        <br />
        <button type="submit">Save Business Profile</button>
      </form>
      {status && <p role="status">{status}</p>}
    </div>
  );
}
