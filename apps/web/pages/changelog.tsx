import { useState, useEffect } from 'react';
// ...existing code...

interface Decision {
  title: string;
  description?: string;
  madeAt: string;
  version?: string;
}

export default function ChangelogPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);

  useEffect(() => {
    async function fetchDecisions() {
      try {
        const res = await fetch('/api/public/decisions');
        if (!res.ok) return;
        const data = await res.json();
        setDecisions(data.decisions || []);
      } catch {
        // best-effort: ignore for static build
      }
    }
    fetchDecisions();
  }, []);

  return (
    <>
      <head>
        <title>NearbyBazaar Changelog</title>
        <meta
          name="description"
          content="See the latest improvements and releases for NearbyBazaar."
        />
      </head>
      <main style={{ maxWidth: 700, margin: '2em auto', padding: '2em' }}>
        <h1>Changelog</h1>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {decisions.map((d, i) => (
            <li key={i} style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 600, fontSize: 18 }}>{d.title}</div>
              {d.version && (
                <span style={{ color: '#888', marginRight: 8 }}>Version: {d.version}</span>
              )}
              <div style={{ color: '#666', marginBottom: 4 }}>
                {new Date(d.madeAt).toLocaleDateString()}
              </div>
              <div>{d.description}</div>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
