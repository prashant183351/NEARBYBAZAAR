import { useState } from 'react';
// ...existing code...

export default function KaizenSubmitPage() {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error' | 'rate-limited'
  >('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    try {
      const res = await fetch('/api/kaizen/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, desc }),
      });
      if (res.status === 429) return setStatus('rate-limited');
      if (!res.ok) return setStatus('error');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div
      style={{
        maxWidth: 500,
        margin: '2em auto',
        padding: '2em',
        border: '1px solid #eee',
        borderRadius: 8,
      }}
    >
      <h2>Submit a Kaizen Idea</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Title
          <br />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ width: '100%', marginBottom: 12 }}
          />
        </label>
        <label>
          Description
          <br />
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            required
            style={{ width: '100%', marginBottom: 12 }}
          />
        </label>
        <button type="submit" disabled={status === 'submitting'}>
          Submit
        </button>
      </form>
      {status === 'success' && <div style={{ color: 'green', marginTop: 12 }}>Idea submitted!</div>}
      {status === 'error' && (
        <div style={{ color: 'red', marginTop: 12 }}>Error submitting idea.</div>
      )}
      {status === 'rate-limited' && (
        <div style={{ color: 'orange', marginTop: 12 }}>
          Too many submissions. Please wait and try again.
        </div>
      )}
    </div>
  );
}
