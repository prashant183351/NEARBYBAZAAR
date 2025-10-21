import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface PlanReport {
    planName: string;
    planTier: string;
    vendorCount: number;
    revenue: number;
    currency: string;
}

export default function AdminPlanReports() {
    const [reports, setReports] = useState<PlanReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ start: '', end: '', planTier: '' });

    useEffect(() => {
        async function fetchReports() {
            // Simulate API call
            const res = await axios.get('/api/admin/reports/plans', { params: filter });
            setReports(res.data.reports);
            setLoading(false);
        }
        fetchReports();
    }, [filter]);

    function exportCSV() {
        const rows = [
            ['Plan Name', 'Tier', 'Vendor Count', 'Revenue', 'Currency'],
            ...reports.map(r => [r.planName, r.planTier, r.vendorCount, r.revenue, r.currency])
        ];
        const csv = rows.map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plan_report.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div style={{ maxWidth: 800, margin: '2em auto', padding: '2em', border: '1px solid #eee', borderRadius: 8 }}>
            <h2>Plan Subscription & Revenue Reports</h2>
            <div style={{ marginBottom: 16 }}>
                <label>Start: <input type="date" value={filter.start} onChange={e => setFilter(f => ({ ...f, start: e.target.value }))} /></label>
                <label style={{ marginLeft: 16 }}>End: <input type="date" value={filter.end} onChange={e => setFilter(f => ({ ...f, end: e.target.value }))} /></label>
                <label style={{ marginLeft: 16 }}>Plan Tier: <input type="text" value={filter.planTier} onChange={e => setFilter(f => ({ ...f, planTier: e.target.value }))} /></label>
                <button style={{ marginLeft: 16 }} onClick={exportCSV}>Export CSV</button>
            </div>
            {loading ? <div>Loading...</div> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th>Plan Name</th>
                            <th>Tier</th>
                            <th>Vendor Count</th>
                            <th>Revenue</th>
                            <th>Currency</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.map((r, i) => (
                            <tr key={i}>
                                <td>{r.planName}</td>
                                <td>{r.planTier}</td>
                                <td>{r.vendorCount}</td>
                                <td>{r.revenue}</td>
                                <td>{r.currency}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
