import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface VendorMetrics {
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  orderDefectRate: number;
  lateShipmentRate: number;
  cancellationRate: number;
  totalOrders: number;
  status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
}

interface Summary {
  total: number;
  critical: number;
  needsImprovement: number;
  good: number;
  excellent: number;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'excellent':
      return '#10b981';
    case 'good':
      return '#3b82f6';
    case 'needs_improvement':
      return '#f59e0b';
    case 'critical':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

export default function AdminReputationDashboard() {
  const [data, setData] = useState<{ vendors: VendorMetrics[]; summary: Summary } | null>(null);
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    axios
      .get(`/api/admin/reputation?days=${period}`)
      .then((r) => {
        setData(r.data.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load reputation data', err);
        setLoading(false);
      });
  }, [period]);

  if (loading) return <div style={{ padding: '20px' }}>Loading reputation data...</div>;
  if (!data) return <div style={{ padding: '20px' }}>Failed to load data</div>;

  const filteredVendors =
    filter === 'all' ? data.vendors : data.vendors.filter((v) => v.status === filter);

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h1 style={{ margin: 0 }}>Vendor Reputation Dashboard</h1>
        <div>
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            style={{ padding: '8px', fontSize: '14px', marginRight: '10px' }}
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '15px',
          marginBottom: '30px',
        }}
      >
        <div
          style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Total Vendors</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{data.summary.total}</div>
        </div>
        <div
          style={{
            backgroundColor: '#fee2e2',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center',
            cursor: 'pointer',
          }}
          onClick={() => setFilter(filter === 'critical' ? 'all' : 'critical')}
        >
          <div style={{ fontSize: '14px', color: '#991b1b', marginBottom: '5px' }}>Critical</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc2626' }}>
            {data.summary.critical}
          </div>
        </div>
        <div
          style={{
            backgroundColor: '#fed7aa',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center',
            cursor: 'pointer',
          }}
          onClick={() => setFilter(filter === 'needs_improvement' ? 'all' : 'needs_improvement')}
        >
          <div style={{ fontSize: '14px', color: '#92400e', marginBottom: '5px' }}>
            Needs Improvement
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>
            {data.summary.needsImprovement}
          </div>
        </div>
        <div
          style={{
            backgroundColor: '#dbeafe',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center',
            cursor: 'pointer',
          }}
          onClick={() => setFilter(filter === 'good' ? 'all' : 'good')}
        >
          <div style={{ fontSize: '14px', color: '#1e40af', marginBottom: '5px' }}>Good</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>
            {data.summary.good}
          </div>
        </div>
        <div
          style={{
            backgroundColor: '#d1fae5',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center',
            cursor: 'pointer',
          }}
          onClick={() => setFilter(filter === 'excellent' ? 'all' : 'excellent')}
        >
          <div style={{ fontSize: '14px', color: '#065f46', marginBottom: '5px' }}>Excellent</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
            {data.summary.excellent}
          </div>
        </div>
      </div>

      {/* Vendors Table */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
            <tr>
              <th
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#374151',
                }}
              >
                Vendor
              </th>
              <th
                style={{
                  padding: '12px',
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#374151',
                }}
              >
                Status
              </th>
              <th
                style={{
                  padding: '12px',
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#374151',
                }}
              >
                Orders
              </th>
              <th
                style={{
                  padding: '12px',
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#374151',
                }}
              >
                ODR %
              </th>
              <th
                style={{
                  padding: '12px',
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#374151',
                }}
              >
                Late %
              </th>
              <th
                style={{
                  padding: '12px',
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#374151',
                }}
              >
                Cancel %
              </th>
              <th
                style={{
                  padding: '12px',
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#374151',
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredVendors.map((vendor, idx) => (
              <tr
                key={vendor.vendorId}
                style={{
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: idx % 2 === 0 ? 'white' : '#f9fafb',
                }}
              >
                <td style={{ padding: '12px' }}>
                  <div style={{ fontWeight: '500' }}>{vendor.vendorName}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{vendor.vendorEmail}</div>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <span
                    style={{
                      backgroundColor: getStatusColor(vendor.status),
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                    }}
                  >
                    {vendor.status.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: '500' }}>
                  {vendor.totalOrders}
                </td>
                <td
                  style={{
                    padding: '12px',
                    textAlign: 'center',
                    color: vendor.orderDefectRate >= 2 ? '#dc2626' : '#374151',
                  }}
                >
                  {vendor.orderDefectRate}%
                </td>
                <td
                  style={{
                    padding: '12px',
                    textAlign: 'center',
                    color: vendor.lateShipmentRate >= 7 ? '#dc2626' : '#374151',
                  }}
                >
                  {vendor.lateShipmentRate}%
                </td>
                <td
                  style={{
                    padding: '12px',
                    textAlign: 'center',
                    color: vendor.cancellationRate >= 5 ? '#dc2626' : '#374151',
                  }}
                >
                  {vendor.cancellationRate}%
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginRight: '5px',
                    }}
                    onClick={() => (window.location.href = `/admin/vendors/${vendor.vendorId}`)}
                  >
                    View
                  </button>
                  {(vendor.status === 'critical' || vendor.status === 'needs_improvement') && (
                    <button
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                      onClick={() => alert(`Action vendor ${vendor.vendorName}`)}
                    >
                      Action
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredVendors.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          No vendors found with status: {filter}
        </div>
      )}
    </div>
  );
}
