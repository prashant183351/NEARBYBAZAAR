import { useState, useEffect } from 'react';
// ...existing code...
import axios from 'axios';

interface FomoAnalytics {
  totalWithFomo: number;
  totalWithoutFomo: number;
  ctrWithFomo: number;
  ctrWithoutFomo: number;
  conversionWithFomo: number;
  conversionWithoutFomo: number;
  byRegion: Array<{
    region: string;
    ctrWithFomo: number;
    ctrWithoutFomo: number;
    conversionWithFomo: number;
    conversionWithoutFomo: number;
  }>;
}

const FomoAnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<FomoAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/admin/api/analytics/fomo').then((r) => {
      setData(r.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8">Loading FOMO analytics...</div>;
  if (!data) return <div className="p-8 text-red-600">No analytics data available.</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">FOMO Analytics Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded shadow p-6">
          <h2 className="font-semibold mb-2">Global Metrics</h2>
          <ul className="text-sm space-y-1">
            <li>
              <b>Products with FOMO:</b> {data.totalWithFomo}
            </li>
            <li>
              <b>Products without FOMO:</b> {data.totalWithoutFomo}
            </li>
            <li>
              <b>CTR (FOMO):</b> {(data.ctrWithFomo * 100).toFixed(2)}%
            </li>
            <li>
              <b>CTR (No FOMO):</b> {(data.ctrWithoutFomo * 100).toFixed(2)}%
            </li>
            <li>
              <b>Conversion Rate (FOMO):</b> {(data.conversionWithFomo * 100).toFixed(2)}%
            </li>
            <li>
              <b>Conversion Rate (No FOMO):</b> {(data.conversionWithoutFomo * 100).toFixed(2)}%
            </li>
          </ul>
        </div>
        <div className="bg-white rounded shadow p-6">
          <h2 className="font-semibold mb-2">By Region</h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1">Region</th>
                <th>CTR (FOMO)</th>
                <th>CTR (No FOMO)</th>
                <th>Conv. (FOMO)</th>
                <th>Conv. (No FOMO)</th>
              </tr>
            </thead>
            <tbody>
              {data.byRegion.map((r) => (
                <tr key={r.region} className="border-b last:border-0">
                  <td className="py-1">{r.region}</td>
                  <td className="text-center">{(r.ctrWithFomo * 100).toFixed(2)}%</td>
                  <td className="text-center">{(r.ctrWithoutFomo * 100).toFixed(2)}%</td>
                  <td className="text-center">{(r.conversionWithFomo * 100).toFixed(2)}%</td>
                  <td className="text-center">{(r.conversionWithoutFomo * 100).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-white rounded shadow p-6 mt-8">
        <h2 className="font-semibold mb-2">Interpretation</h2>
        <p className="text-sm text-gray-700">
          This dashboard compares click-through and conversion rates for products with and without
          FOMO badges, globally and by region. Use these insights to optimize FOMO settings and
          marketing strategies.
        </p>
      </div>
    </div>
  );
};

export default FomoAnalyticsDashboard;
