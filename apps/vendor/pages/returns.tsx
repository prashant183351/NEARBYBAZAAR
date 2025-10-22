import React, { useState } from 'react';

/**
 * STUB: Vendor Returns Management Page
 *
 * This is a placeholder UI for managing RMA (Return Merchandise Authorization) requests.
 * Full implementation pending.
 */

interface ReturnRequest {
  _id: string;
  rmaNumber: string;
  orderId: string;
  customerName: string;
  status: string;
  requestedAt: string;
  items: { name: string; quantity: number; reason: string }[];
  totalAmount: number;
}

// Dummy data for demonstration
const dummyReturns: ReturnRequest[] = [
  {
    _id: '1',
    rmaNumber: 'RMA-2025-000001',
    orderId: 'ORD-12345',
    customerName: 'John Doe',
    status: 'requested',
    requestedAt: '2025-10-19T10:00:00Z',
    items: [{ name: 'Product A', quantity: 1, reason: 'defective' }],
    totalAmount: 1499,
  },
  {
    _id: '2',
    rmaNumber: 'RMA-2025-000002',
    orderId: 'ORD-12346',
    customerName: 'Jane Smith',
    status: 'shipped_back',
    requestedAt: '2025-10-18T14:30:00Z',
    items: [{ name: 'Product B', quantity: 2, reason: 'wrong_item' }],
    totalAmount: 2998,
  },
];

export default function ReturnsPage() {
  const [returns] = useState<ReturnRequest[]>(dummyReturns);
  const [filter, setFilter] = useState<string>('all');

  const filteredReturns = filter === 'all' ? returns : returns.filter((r) => r.status === filter);

  const handleApprove = (rmaNumber: string) => {
    // TODO: Call API to approve return
    console.log(`Approve RMA: ${rmaNumber}`);
    alert(`TODO: Approve RMA ${rmaNumber}`);
  };

  const handleReject = (rmaNumber: string) => {
    // TODO: Call API to reject return
    console.log(`Reject RMA: ${rmaNumber}`);
    alert(`TODO: Reject RMA ${rmaNumber}`);
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      requested: '#ffa500',
      vendor_reviewing: '#ffa500',
      vendor_approved: '#4caf50',
      vendor_rejected: '#f44336',
      shipped_back: '#2196f3',
      refunded: '#4caf50',
    };
    return colors[status] || '#999';
  };

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 16 }}>
        <h2>Returns Management (RMA) - STUB</h2>
        <p style={{ color: '#666', fontSize: 14 }}>
          ⚠️ This is a stub implementation. Full RMA workflow coming soon.
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ marginRight: 8 }}>Filter by status:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Returns</option>
          <option value="requested">Requested</option>
          <option value="vendor_reviewing">Under Review</option>
          <option value="vendor_approved">Approved</option>
          <option value="shipped_back">Shipped Back</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: 8, textAlign: 'left' }}>RMA #</th>
            <th style={{ padding: 8, textAlign: 'left' }}>Order #</th>
            <th style={{ padding: 8, textAlign: 'left' }}>Customer</th>
            <th style={{ padding: 8, textAlign: 'left' }}>Items</th>
            <th style={{ padding: 8, textAlign: 'left' }}>Status</th>
            <th style={{ padding: 8, textAlign: 'left' }}>Amount</th>
            <th style={{ padding: 8, textAlign: 'left' }}>Requested</th>
            <th style={{ padding: 8, textAlign: 'left' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredReturns.map((ret) => (
            <tr key={ret._id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: 8 }}>
                <strong>{ret.rmaNumber}</strong>
              </td>
              <td style={{ padding: 8 }}>{ret.orderId}</td>
              <td style={{ padding: 8 }}>{ret.customerName}</td>
              <td style={{ padding: 8 }}>
                {ret.items.map((item, idx) => (
                  <div key={idx} style={{ fontSize: 12 }}>
                    {item.quantity}x {item.name} ({item.reason})
                  </div>
                ))}
              </td>
              <td style={{ padding: 8 }}>
                <span
                  style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: 12,
                    background: getStatusBadgeColor(ret.status),
                    color: 'white',
                  }}
                >
                  {ret.status.replace(/_/g, ' ')}
                </span>
              </td>
              <td style={{ padding: 8 }}>₹{ret.totalAmount.toFixed(2)}</td>
              <td style={{ padding: 8 }}>{new Date(ret.requestedAt).toLocaleDateString()}</td>
              <td style={{ padding: 8 }}>
                {ret.status === 'requested' && (
                  <>
                    <button
                      onClick={() => handleApprove(ret.rmaNumber)}
                      style={{ marginRight: 4, fontSize: 12 }}
                    >
                      Approve
                    </button>
                    <button onClick={() => handleReject(ret.rmaNumber)} style={{ fontSize: 12 }}>
                      Reject
                    </button>
                  </>
                )}
                {ret.status !== 'requested' && (
                  <button style={{ fontSize: 12 }}>View Details</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredReturns.length === 0 && (
        <div style={{ textAlign: 'center', padding: 32, color: '#999' }}>
          No returns found for the selected filter.
        </div>
      )}

      <div style={{ marginTop: 32, padding: 16, background: '#f5f5f5', borderRadius: 4 }}>
        <h3>TODO: Features to Implement</h3>
        <ul>
          <li>Connect to real RMA API endpoints</li>
          <li>Return details modal with images and notes</li>
          <li>Inspection interface with photo upload</li>
          <li>Refund processing integration</li>
          <li>Shipping label generation</li>
          <li>Return analytics dashboard</li>
          <li>Status timeline/history</li>
          <li>Communication thread with customer</li>
          <li>Dropship supplier coordination UI</li>
        </ul>
      </div>
    </div>
  );
}
