import { useEffect, useState } from 'react';
import axios from 'axios';

export default function B2BDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await axios.get('/api/b2b/me');
        if (!mounted) return;
        setProfile(r.data?.data);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.response?.data?.error || e.message || 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Failed to load: {error}</p>;

  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', padding: '1rem' }}>
      <h1>B2B Dashboard</h1>
      {!profile?.isBusiness ? (
        <p>
          Your account is not a business account yet.{' '}
          <a href="/b2b/register">Upgrade to Business</a>
        </p>
      ) : (
        <div>
          <p>
            Status: <strong>Business Enabled</strong>
          </p>
          <h3>Business Profile</h3>
          <pre>{JSON.stringify(profile?.businessProfile || {}, null, 2)}</pre>
          <ul>
            <li>
              Access wholesale-only products in listings and product detail pages.
            </li>
            <li>Create RFQs for bulk orders and compare vendor quotes.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
