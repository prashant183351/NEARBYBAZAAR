import { useState, useEffect } from 'react';
// ...existing code...

interface NotificationPreference {
  notificationType: string;
  channels: string[];
  enabled: boolean;
  aggregateEnabled?: boolean;
  aggregateIntervalMinutes?: number;
}

const notificationTypes = [
  { value: 'order_received', label: 'New Orders' },
  { value: 'order_shipped', label: 'Order Shipped' },
  { value: 'stock_low', label: 'Low Stock' },
  { value: 'stock_out', label: 'Out of Stock' },
  { value: 'price_updated', label: 'Price Updates' },
  { value: 'supplier_sync_failed', label: 'Supplier Sync Failures' },
  { value: 'compliance_required', label: 'Compliance Required' },
  { value: 'sku_mapping_conflict', label: 'SKU Mapping Conflicts' },
];

const channels = [
  { value: 'email', label: 'Email' },
  { value: 'in_app', label: 'In-App' },
  { value: 'web_push', label: 'Web Push' },
  { value: 'sms', label: 'SMS' },
];

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState<Record<string, NotificationPreference>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications/preferences');
      const data = await res.json();
      const prefMap: Record<string, NotificationPreference> = {};
      (data.preferences || []).forEach((p: NotificationPreference) => {
        prefMap[p.notificationType] = p;
      });
      setPreferences(prefMap);
    } catch (err) {
      console.error('Failed to fetch preferences:', err);
    }
    setLoading(false);
  };

  const updatePreference = async (type: string, updates: Partial<NotificationPreference>) => {
    try {
      const current = preferences[type] || {
        channels: ['email', 'in_app'],
        enabled: true,
      };

      const updated = { ...current, ...updates };

      await fetch(`/api/notifications/preferences/${type}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });

      setPreferences((prev) => ({ ...prev, [type]: updated }));
    } catch (err) {
      console.error('Failed to update preference:', err);
    }
  };

  if (loading) {
    return <div style={{ padding: 32 }}>Loading preferences...</div>;
  }

  return (
    <div style={{ padding: 32 }}>
      <h2>Notification Preferences</h2>
      <p>Configure how you want to receive notifications for different events.</p>

      <table style={{ width: '100%', marginTop: 16, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: 8, borderBottom: '2px solid #ddd' }}>Event</th>
            <th style={{ textAlign: 'left', padding: 8, borderBottom: '2px solid #ddd' }}>
              Enabled
            </th>
            <th style={{ textAlign: 'left', padding: 8, borderBottom: '2px solid #ddd' }}>
              Channels
            </th>
            <th style={{ textAlign: 'left', padding: 8, borderBottom: '2px solid #ddd' }}>
              Aggregate
            </th>
          </tr>
        </thead>
        <tbody>
          {notificationTypes.map(({ value, label }) => {
            const pref = preferences[value] || {
              channels: ['email', 'in_app'],
              enabled: true,
              aggregateEnabled: false,
              aggregateIntervalMinutes: 60,
            };

            return (
              <tr key={value} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 8 }}>{label}</td>
                <td style={{ padding: 8 }}>
                  <input
                    type="checkbox"
                    checked={pref.enabled}
                    onChange={(e) => updatePreference(value, { enabled: e.target.checked })}
                  />
                </td>
                <td style={{ padding: 8 }}>
                  {channels.map((ch) => (
                    <label key={ch.value} style={{ marginRight: 8 }}>
                      <input
                        type="checkbox"
                        checked={pref.channels?.includes(ch.value)}
                        onChange={(e) => {
                          const newChannels = e.target.checked
                            ? [...(pref.channels || []), ch.value]
                            : (pref.channels || []).filter((c) => c !== ch.value);
                          updatePreference(value, { channels: newChannels });
                        }}
                      />
                      {ch.label}
                    </label>
                  ))}
                </td>
                <td style={{ padding: 8 }}>
                  <label>
                    <input
                      type="checkbox"
                      checked={pref.aggregateEnabled}
                      onChange={(e) =>
                        updatePreference(value, { aggregateEnabled: e.target.checked })
                      }
                    />
                    Every
                  </label>
                  <input
                    type="number"
                    value={pref.aggregateIntervalMinutes || 60}
                    onChange={(e) =>
                      updatePreference(value, { aggregateIntervalMinutes: Number(e.target.value) })
                    }
                    style={{ width: 60, marginLeft: 4, marginRight: 4 }}
                    disabled={!pref.aggregateEnabled}
                  />
                  min
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
