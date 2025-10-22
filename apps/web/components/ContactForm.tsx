import React, { useState } from 'react';

interface ContactFormProps {
  vendorId: string;
}

export const ContactForm: React.FC<ContactFormProps> = ({ vendorId }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error' | 'rate-limited'>(
    'idle',
  );
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setError('');
    try {
      const res = await fetch(`/api/contact-vendor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, name, email, message }),
      });
      if (res.status === 429) {
        setStatus('rate-limited');
        setError('Too many requests. Please try again later.');
        return;
      }
      if (!res.ok) {
        setStatus('error');
        setError('Failed to send message.');
        return;
      }
      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setError('Failed to send message.');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: 400,
        margin: '0 auto',
        padding: 16,
        border: '1px solid #eee',
        borderRadius: 8,
      }}
    >
      <h3>Contact Vendor</h3>
      <label>
        Name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ width: '100%' }}
        />
      </label>
      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%' }}
        />
      </label>
      <label>
        Message
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          style={{ width: '100%' }}
          rows={4}
        />
      </label>
      <button type="submit" disabled={status === 'sending'} style={{ marginTop: 12 }}>
        {status === 'sending' ? 'Sending...' : 'Send Message'}
      </button>
      {status === 'sent' && <div style={{ color: 'green', marginTop: 8 }}>Message sent!</div>}
      {status === 'error' && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      {status === 'rate-limited' && <div style={{ color: 'orange', marginTop: 8 }}>{error}</div>}
    </form>
  );
};
