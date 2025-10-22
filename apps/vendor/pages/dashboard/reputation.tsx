import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface ReputationMetrics {
  orderDefectRate: number;
  lateShipmentRate: number;
  cancellationRate: number;
  totalOrders: number;
  period: string;
  status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'excellent':
      return 'green';
    case 'good':
      return 'blue';
    case 'needs_improvement':
      return 'orange';
    case 'critical':
      return 'red';
    default:
      return 'gray';
  }
};

const getStatusBadge = (status: string) => {
  const color = getStatusColor(status);
  const text = status.replace('_', ' ').toUpperCase();
  return (
    <span
      style={{
        backgroundColor: color,
        color: 'white',
        padding: '4px 12px',
        borderRadius: '4px',
        fontWeight: 'bold',
        fontSize: '12px',
      }}
    >
      {text}
    </span>
  );
};

const MetricCard = ({ title, value, threshold, status }: any) => {
  const bgColor =
    status === 'excellent'
      ? '#e6ffe6'
      : status === 'good'
        ? '#e6f3ff'
        : status === 'needs_improvement'
          ? '#fff4e6'
          : '#ffe6e6';

  return (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '20px',
        margin: '10px 0',
        backgroundColor: bgColor,
      }}
    >
      <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>{title}</h3>
      <div style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0' }}>{value}%</div>
      <div style={{ fontSize: '12px', color: '#666' }}>
        Excellent: &lt;{threshold.excellent}% | Good: &lt;{threshold.good}% | Warning: &lt;
        {threshold.warning}% | Critical: &ge;{threshold.critical}%
      </div>
    </div>
  );
};

export default function VendorReputationScorecard() {
  const [metrics, setMetrics] = useState<ReputationMetrics | null>(null);
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`/api/vendor/reputation?days=${period}`)
      .then((r) => {
        setMetrics(r.data.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load reputation metrics', err);
        setLoading(false);
      });
  }, [period]);

  if (loading) return <div style={{ padding: '20px' }}>Loading reputation metrics...</div>;
  if (!metrics) return <div style={{ padding: '20px' }}>Failed to load metrics</div>;

  const thresholds = {
    odr: { excellent: 0.5, good: 1, warning: 2, critical: 3 },
    lateShipment: { excellent: 2, good: 4, warning: 7, critical: 10 },
    cancellation: { excellent: 1, good: 2.5, warning: 5, critical: 7.5 },
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h1 style={{ margin: 0 }}>Performance Scorecard</h1>
        <div>
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            style={{ padding: '8px', fontSize: '14px' }}
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>Overall Status</h2>
          <div>{getStatusBadge(metrics.status)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '14px', color: '#666' }}>Total Orders</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{metrics.totalOrders}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{metrics.period}</div>
        </div>
      </div>

      {metrics.status === 'critical' && (
        <div
          style={{
            backgroundColor: '#fee',
            border: '2px solid #c00',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px',
          }}
        >
          <strong style={{ color: '#c00' }}>⚠️ CRITICAL STATUS</strong>
          <p style={{ margin: '5px 0 0 0' }}>
            Your account may be suspended. Please review the metrics below and take immediate action
            to improve performance.
          </p>
        </div>
      )}

      {metrics.status === 'needs_improvement' && (
        <div
          style={{
            backgroundColor: '#ffeaa7',
            border: '2px solid #fdcb6e',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px',
          }}
        >
          <strong style={{ color: '#e17055' }}>⚠️ NEEDS IMPROVEMENT</strong>
          <p style={{ margin: '5px 0 0 0' }}>
            Your performance is below marketplace standards. Please take action to improve your
            metrics.
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
        <MetricCard
          title="Order Defect Rate (ODR)"
          value={metrics.orderDefectRate}
          threshold={thresholds.odr}
          status={
            metrics.orderDefectRate < thresholds.odr.excellent
              ? 'excellent'
              : metrics.orderDefectRate < thresholds.odr.good
                ? 'good'
                : metrics.orderDefectRate < thresholds.odr.warning
                  ? 'needs_improvement'
                  : 'critical'
          }
        />
        <MetricCard
          title="Late Shipment Rate"
          value={metrics.lateShipmentRate}
          threshold={thresholds.lateShipment}
          status={
            metrics.lateShipmentRate < thresholds.lateShipment.excellent
              ? 'excellent'
              : metrics.lateShipmentRate < thresholds.lateShipment.good
                ? 'good'
                : metrics.lateShipmentRate < thresholds.lateShipment.warning
                  ? 'needs_improvement'
                  : 'critical'
          }
        />
        <MetricCard
          title="Cancellation Rate"
          value={metrics.cancellationRate}
          threshold={thresholds.cancellation}
          status={
            metrics.cancellationRate < thresholds.cancellation.excellent
              ? 'excellent'
              : metrics.cancellationRate < thresholds.cancellation.good
                ? 'good'
                : metrics.cancellationRate < thresholds.cancellation.warning
                  ? 'needs_improvement'
                  : 'critical'
          }
        />
      </div>

      <div
        style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#f0f0f0',
          borderRadius: '8px',
        }}
      >
        <h3 style={{ margin: '0 0 10px 0' }}>What do these metrics mean?</h3>
        <ul style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <li>
            <strong>Order Defect Rate (ODR):</strong> Percentage of orders with refunds, returns, or
            disputes. Lower is better.
          </li>
          <li>
            <strong>Late Shipment Rate:</strong> Percentage of orders shipped after the expected
            dispatch date. Lower is better.
          </li>
          <li>
            <strong>Cancellation Rate:</strong> Percentage of orders cancelled by you or due to
            out-of-stock. Lower is better.
          </li>
        </ul>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          Maintaining excellent or good status helps build buyer trust and improves your store's
          visibility in search results.
        </p>
      </div>
    </div>
  );
}
