import React from 'react';
import KpiCard from '../components/KpiCard';

const sections = [
  { key: 'strategic', label: 'Strategic' },
  { key: 'operational', label: 'Operational' },
  { key: 'ground', label: 'Ground' },
];

export default function AdminDashboard() {
  const [active, setActive] = React.useState('strategic');
  const [stats, setStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [kaizenFeed, setKaizenFeed] = React.useState<any>(null);
  const [notifications, setNotifications] = React.useState<any>(null);

  // Initial fetch for stats, kaizen, notifications
  React.useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/admin/api/admin-stats').then((r) => r.json()),
      fetch('/admin/api/kaizen-feed').then((r) => r.json()),
      fetch('/admin/api/notifications').then((r) => r.json()),
    ])
      .then(([stats, kaizen, notifs]) => {
        setStats(stats);
        setKaizenFeed(kaizen);
        setNotifications(notifs);
      })
      .finally(() => setLoading(false));
  }, []);

  // Refresh handler for Kaizen & Notifications Feed
  async function handleRefresh() {
    setLoading(true);
    const [statsRes, kaizenRes, notifRes] = await Promise.all([
      fetch('/admin/api/admin-stats'),
      fetch('/admin/api/kaizen-feed'),
      fetch('/admin/api/notifications'),
    ]);
    setStats(await statsRes.json());
    setKaizenFeed(await kaizenRes.json());
    setNotifications(await notifRes.json());
    setLoading(false);
  }

  // Kaizen approve/reject action handler
  async function handleKaizenAction(id: string, action: 'approve' | 'reject') {
    setLoading(true);
    await fetch(`/admin/api/kaizen/${id}/${action}`, { method: 'POST' });
    await handleRefresh();
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 font-bold text-xl border-b">Admin Dashboard</div>
        <nav className="flex-1 p-4 space-y-2">
          {sections.map((s) => (
            <button
              key={s.key}
              className={`w-full text-left px-4 py-2 rounded transition font-medium ${active === s.key ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
              onClick={() => setActive(s.key)}
            >
              {s.label}
            </button>
          ))}
        </nav>
      </aside>
      {/* Main content */}
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-6">
          {sections.find((s) => s.key === active)?.label} Overview
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <KpiCard
            label="Vendors Onboarded"
            value={loading ? '...' : (stats?.vendors?.total ?? '-')}
            sublabel={`Today: ${stats?.vendors?.today ?? '-'}`}
            color="border-blue-500"
          />
          <KpiCard
            label="Orders Processed"
            value={loading ? '...' : (stats?.orders?.total ?? '-')}
            sublabel={`Today: ${stats?.orders?.today ?? '-'}, This week: ${stats?.orders?.week ?? '-'}`}
            color="border-green-500"
          />
          <KpiCard
            label="Disputes Pending"
            value={loading ? '...' : (stats?.disputes?.pending ?? '-')}
            color="border-yellow-500"
          />
          <KpiCard
            label="Revenue vs Sathi Cost"
            value={
              loading
                ? '...'
                : `₹${stats?.revenue?.week ?? '-'} / ₹${stats?.sathiCost?.week ?? '-'}`
            }
            sublabel="This week"
            color="border-purple-500"
          />
        </div>

        {/* Finance & Compliance Snapshot */}
        <section className="bg-white rounded shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Finance & Compliance Snapshot</h2>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              onClick={() => {
                // Download CSV (simulate for now)
                const rows = [
                  ['Metric', 'Value'],
                  ['Commission Collected (This Month)', stats?.finance?.commissionMonth ?? '-'],
                  ['Payouts Made (This Month)', stats?.finance?.payoutsMonth ?? '-'],
                  ['Vendor Payouts Pending', stats?.finance?.payoutsPending ?? '-'],
                  [
                    'Sathi Incentives Paid (This Month)',
                    stats?.finance?.sathiIncentivesMonth ?? '-',
                  ],
                  ['Vendors Pending GST Filing', stats?.compliance?.gstPending ?? '-'],
                  ['Vendors Pending TDS Filing', stats?.compliance?.tdsPending ?? '-'],
                  ['Vendors NDA Not Signed', stats?.compliance?.ndaPending ?? '-'],
                ];
                const csv = rows.map((r) => r.join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `finance_compliance_snapshot_${new Date().toISOString().slice(0, 10)}.csv`;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }, 100);
              }}
            >
              Download CSV
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="font-medium mb-1">Commission Collected (This Month)</div>
              <div className="text-lg">₹{stats?.finance?.commissionMonth ?? '-'}</div>
            </div>
            <div>
              <div className="font-medium mb-1">Payouts Made (This Month)</div>
              <div className="text-lg">₹{stats?.finance?.payoutsMonth ?? '-'}</div>
            </div>
            <div>
              <div className="font-medium mb-1">Vendor Payouts Pending</div>
              <div className="text-lg">₹{stats?.finance?.payoutsPending ?? '-'}</div>
            </div>
            <div>
              <div className="font-medium mb-1">Sathi Incentives Paid (This Month)</div>
              <div className="text-lg">₹{stats?.finance?.sathiIncentivesMonth ?? '-'}</div>
            </div>
          </div>
          <div className="mt-6">
            <div className="font-semibold mb-2">Compliance Alerts</div>
            <ul className="list-disc pl-6 text-sm text-red-700">
              <li>
                {(stats?.compliance?.gstPending ?? 0) > 0
                  ? `${stats?.compliance?.gstPending} vendors pending GST filing`
                  : 'No vendors pending GST filing'}
              </li>
              <li>
                {(stats?.compliance?.tdsPending ?? 0) > 0
                  ? `${stats?.compliance?.tdsPending} vendors pending TDS filing`
                  : 'No vendors pending TDS filing'}
              </li>
              <li>
                {(stats?.compliance?.ndaPending ?? 0) > 0
                  ? `${stats?.compliance?.ndaPending} vendors have not signed NDA`
                  : 'All vendors have signed NDA'}
              </li>
            </ul>
          </div>
        </section>

        {/* Kaizen & Notifications Feed */}
        <section className="bg-white rounded shadow p-6 min-h-[300px] mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Kaizen & Notifications Feed</h2>
            <button
              className="px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200"
              onClick={() => handleRefresh()}
            >
              Refresh
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Kaizen Suggestions Feed */}
            <div>
              <div className="font-semibold mb-2">Recent Kaizen Suggestions</div>
              <ul className="divide-y">
                {(kaizenFeed?.items ?? []).length === 0 && (
                  <li className="text-gray-400 py-4">No recent suggestions.</li>
                )}
                {(kaizenFeed?.items ?? []).map((item: any) => (
                  <li
                    key={item.id}
                    className="py-3 flex flex-col md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-gray-500 mb-1">
                        By {item.ownerName} • {new Date(item.createdAt).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-700 line-clamp-2">{item.summary}</div>
                    </div>
                    <div className="flex gap-2 mt-2 md:mt-0">
                      <button
                        className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                        onClick={() => handleKaizenAction(item.id, 'approve')}
                      >
                        Approve
                      </button>
                      <button
                        className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                        onClick={() => handleKaizenAction(item.id, 'reject')}
                      >
                        Reject
                      </button>
                      <a
                        href={`/admin/kaizen/${item.id}`}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Details
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {/* System Notifications Feed */}
            <div>
              <div className="font-semibold mb-2">System Notifications</div>
              <ul className="divide-y">
                {(notifications?.items ?? []).length === 0 && (
                  <li className="text-gray-400 py-4">No notifications.</li>
                )}
                {(notifications?.items ?? []).map((n: any) => (
                  <li key={n.id} className="py-3 flex flex-col">
                    <div className="font-medium text-sm">{n.message}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Placeholder for future content */}
        <div className="bg-white rounded shadow p-6 min-h-[300px]">
          <p className="text-gray-500">Select a section to view metrics and details.</p>
        </div>
      </main>
    </div>
  );
}
