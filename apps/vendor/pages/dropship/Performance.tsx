import React, { useState } from 'react';

const dummyStats = [
  { supplier: 'Acme Corp', products: 12, sales: 1200 },
  { supplier: 'Beta Ltd', products: 5, sales: 300 },
];

export default function PerformancePage() {
  const [filter, setFilter] = useState('');
  const filtered = filter ? dummyStats.filter((s) => s.supplier === filter) : dummyStats;

  return (
    <div style={{ padding: 32 }}>
      <h2>Performance</h2>
      <label>
        Filter by supplier:
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ marginLeft: 8 }}
        >
          <option value="">All</option>
          {dummyStats.map((s) => (
            <option key={s.supplier} value={s.supplier}>
              {s.supplier}
            </option>
          ))}
        </select>
      </label>
      <table style={{ width: '100%', marginTop: 16 }}>
        <thead>
          <tr>
            <th>Supplier</th>
            <th>Products</th>
            <th>Sales</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((s) => (
            <tr key={s.supplier}>
              <td>{s.supplier}</td>
              <td>{s.products}</td>
              <td>{s.sales}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
