import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ABTestType } from '../../../../packages/types/src';

const ABTestAdmin: React.FC = () => {
  const [tests, setTests] = useState<ABTestType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTest, setNewTest] = useState({
    name: '',
    feature: 'fomo',
    scope: 'global',
    variantA: { label: 'Show FOMO', config: {}, users: 0, conversions: 0 },
    variantB: { label: 'Hide FOMO', config: {}, users: 0, conversions: 0 },
  });

  useEffect(() => {
    axios.get('/api/admin/abtest').then(res => {
      setTests(res.data.data);
      setLoading(false);
    }).catch(() => {
      setError('Failed to load A/B tests');
      setLoading(false);
    });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('/api/admin/abtest', newTest);
      setTests([res.data.data, ...tests]);
      setNewTest({
        name: '',
        feature: 'fomo',
        scope: 'global',
        variantA: { label: 'Show FOMO', config: {}, users: 0, conversions: 0 },
        variantB: { label: 'Hide FOMO', config: {}, users: 0, conversions: 0 },
      });
    } catch (e) {
      setError('Failed to create test');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">A/B Test Management</h1>
      <form onSubmit={handleCreate} className="mb-6 bg-gray-50 p-4 rounded shadow">
        <div className="mb-2">
          <label className="block font-semibold">Test Name</label>
          <input className="border p-2 w-full" value={newTest.name} onChange={e => setNewTest({ ...newTest, name: e.target.value })} required />
        </div>
        <div className="mb-2">
          <label className="block font-semibold">Feature</label>
          <select className="border p-2 w-full" value={newTest.feature} onChange={e => setNewTest({ ...newTest, feature: e.target.value as any })}>
            <option value="fomo">FOMO Badge</option>
            <option value="urgency">Urgency</option>
            <option value="badge">Badge</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="mb-2">
          <label className="block font-semibold">Scope</label>
          <select className="border p-2 w-full" value={newTest.scope} onChange={e => setNewTest({ ...newTest, scope: e.target.value as any })}>
            <option value="global">Global</option>
            <option value="category">Category</option>
            <option value="product">Product</option>
          </select>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">Create Test</button>
        {error && <div className="text-red-600 mt-2">{error}</div>}
      </form>
      {loading ? <div>Loading...</div> : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Name</th>
              <th className="p-2">Feature</th>
              <th className="p-2">Scope</th>
              <th className="p-2">A Users</th>
              <th className="p-2">A Conv</th>
              <th className="p-2">B Users</th>
              <th className="p-2">B Conv</th>
              <th className="p-2">Started</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {tests.map(test => (
              <tr key={test.name + test.startedAt}>
                <td className="p-2">{test.name}</td>
                <td className="p-2">{test.feature}</td>
                <td className="p-2">{test.scope}</td>
                <td className="p-2">{test.variantA.users}</td>
                <td className="p-2">{test.variantA.conversions}</td>
                <td className="p-2">{test.variantB.users}</td>
                <td className="p-2">{test.variantB.conversions}</td>
                <td className="p-2">{new Date(test.startedAt).toLocaleDateString()}</td>
                <td className="p-2">{test.enabled ? 'Active' : 'Ended'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ABTestAdmin;
