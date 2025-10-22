import { useState, useEffect } from 'react';
// ...existing code...
import axios from 'axios';

export default function AdminRecommendationDashboard() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    axios.get('/api/admin/recommendation-metrics').then((r) => setData(r.data));
  }, []);
  if (!data) return <div>Loading...</div>;
  return (
    <div>
      <h2>Platform Recommendation Metrics</h2>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {data.metrics.map((m: any) => (
            <tr key={m.name}>
              <td>{m.name}</td>
              <td>{m.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>A/B Test Results</h3>
      <table>
        <thead>
          <tr>
            <th>Test</th>
            <th>Variant</th>
            <th>CTR</th>
            <th>Sales</th>
          </tr>
        </thead>
        <tbody>
          {data.abTests.map((t: any) => (
            <tr key={t.test + '-' + t.variant}>
              <td>{t.test}</td>
              <td>{t.variant}</td>
              <td>{t.ctr}%</td>
              <td>{t.sales}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
