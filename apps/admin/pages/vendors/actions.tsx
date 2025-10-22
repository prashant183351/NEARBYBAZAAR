import React, { useEffect, useState } from 'react';

interface VendorWithMetrics {
  vendorId: string;
  vendorName: string;
  status: string;
  metrics: {
    orderDefectRate: number;
    lateShipmentRate: number;
    cancellationRate: number;
    totalOrders: number;
    defectCount: number;
    lateCount: number;
    cancelCount: number;
    period: string;
  };
  recommendedAction: 'warning' | 'temp_suspend' | 'permanent_block' | null;
  reason: string;
}

interface VendorAction {
  _id: string;
  vendor: string;
  vendorName?: string;
  actionType: 'warning' | 'temp_suspend' | 'permanent_block';
  reason: string;
  status: 'pending' | 'active' | 'overridden' | 'expired';
  triggeredBy: 'system' | 'admin';
  triggeredByUser?: string;
  metrics: any;
  expiresAt?: string;
  overriddenBy?: string;
  overriddenAt?: string;
  overrideReason?: string;
  createdAt: string;
}

interface EscalationHistory {
  vendor: string;
  actions: VendorAction[];
  stats: {
    totalActions: number;
    activeActions: number;
    warnings: number;
    tempSuspensions: number;
    permanentBlocks: number;
    overrides: number;
  };
}

export default function VendorActionsPage() {
  const [pendingVendors, setPendingVendors] = useState<VendorWithMetrics[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [vendorHistory, setVendorHistory] = useState<EscalationHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overrideModal, setOverrideModal] = useState<{
    isOpen: boolean;
    actionId: string | null;
    actionType: string | null;
  }>({ isOpen: false, actionId: null, actionType: null });
  const [overrideReason, setOverrideReason] = useState('');

  // Fetch vendors requiring action
  useEffect(() => {
    fetchPendingVendors();
  }, []);

  // Fetch history when vendor selected
  useEffect(() => {
    if (selectedVendor) {
      fetchVendorHistory(selectedVendor);
    }
  }, [selectedVendor]);

  const fetchPendingVendors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/v1/vendor-actions/pending');
      const data = await response.json();
      if (data.success) {
        setPendingVendors(data.data);
      } else {
        setError(data.error || 'Failed to fetch pending vendors');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorHistory = async (vendorId: string) => {
    try {
      const response = await fetch(`/v1/vendor-actions/vendor/${vendorId}/history`);
      const data = await response.json();
      if (data.success) {
        setVendorHistory(data.data);
      } else {
        setError(data.error || 'Failed to fetch vendor history');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleOverride = async () => {
    if (!overrideModal.actionId || !overrideReason.trim()) {
      alert('Please provide a reason for override');
      return;
    }

    try {
      const response = await fetch(`/v1/vendor-actions/action/${overrideModal.actionId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overrideReason }),
      });
      const data = await response.json();
      if (data.success) {
        alert('Action overridden successfully');
        setOverrideModal({ isOpen: false, actionId: null, actionType: null });
        setOverrideReason('');
        // Refresh data
        fetchPendingVendors();
        if (selectedVendor) {
          fetchVendorHistory(selectedVendor);
        }
      } else {
        alert(data.error || 'Failed to override action');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getActionBadgeColor = (actionType: string) => {
    switch (actionType) {
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'temp_suspend':
        return 'bg-orange-100 text-orange-800';
      case 'permanent_block':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-red-100 text-red-800';
      case 'overridden':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Vendor Actions & Escalations</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Vendors Requiring Action */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Vendors Requiring Action</h2>
          <button
            onClick={fetchPendingVendors}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {pendingVendors.length === 0 ? (
          <p className="text-gray-500">No vendors requiring action</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ODR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Late Ship
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cancel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Recommended
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingVendors.map((vendor) => (
                  <tr key={vendor.vendorId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{vendor.vendorName}</div>
                      <div className="text-xs text-gray-500">{vendor.vendorId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          vendor.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {vendor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {(vendor.metrics.orderDefectRate * 100).toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {(vendor.metrics.lateShipmentRate * 100).toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {(vendor.metrics.cancellationRate * 100).toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {vendor.recommendedAction && (
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getActionBadgeColor(
                            vendor.recommendedAction,
                          )}`}
                        >
                          {vendor.recommendedAction}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedVendor(vendor.vendorId)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Vendor Action History */}
      {selectedVendor && vendorHistory && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Action History for {vendorHistory.vendor}</h2>
            <button
              onClick={() => setSelectedVendor(null)}
              className="text-gray-600 hover:text-gray-800"
            >
              ✕ Close
            </button>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-6 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-2xl font-bold">{vendorHistory.stats.totalActions}</div>
              <div className="text-xs text-gray-600">Total Actions</div>
            </div>
            <div className="bg-blue-50 p-4 rounded">
              <div className="text-2xl font-bold text-blue-600">
                {vendorHistory.stats.activeActions}
              </div>
              <div className="text-xs text-gray-600">Active</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded">
              <div className="text-2xl font-bold text-yellow-600">
                {vendorHistory.stats.warnings}
              </div>
              <div className="text-xs text-gray-600">Warnings</div>
            </div>
            <div className="bg-orange-50 p-4 rounded">
              <div className="text-2xl font-bold text-orange-600">
                {vendorHistory.stats.tempSuspensions}
              </div>
              <div className="text-xs text-gray-600">Suspensions</div>
            </div>
            <div className="bg-red-50 p-4 rounded">
              <div className="text-2xl font-bold text-red-600">
                {vendorHistory.stats.permanentBlocks}
              </div>
              <div className="text-xs text-gray-600">Blocks</div>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <div className="text-2xl font-bold text-green-600">
                {vendorHistory.stats.overrides}
              </div>
              <div className="text-xs text-gray-600">Overrides</div>
            </div>
          </div>

          {/* Actions Timeline */}
          <div className="space-y-4">
            {vendorHistory.actions.map((action) => (
              <div
                key={action._id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full mr-2 ${getActionBadgeColor(
                        action.actionType,
                      )}`}
                    >
                      {action.actionType}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(
                        action.status,
                      )}`}
                    >
                      {action.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(action.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="text-sm text-gray-700 mb-2">
                  <strong>Reason:</strong> {action.reason}
                </div>

                <div className="text-xs text-gray-600 mb-2">
                  <strong>Triggered by:</strong> {action.triggeredBy}
                  {action.triggeredBy === 'admin' && action.triggeredByUser && (
                    <> (User: {action.triggeredByUser})</>
                  )}
                </div>

                {action.expiresAt && action.status === 'active' && (
                  <div className="text-xs text-orange-600 mb-2">
                    <strong>Expires:</strong> {new Date(action.expiresAt).toLocaleString()}
                  </div>
                )}

                {action.status === 'overridden' && (
                  <div className="text-xs text-green-600 mb-2">
                    <strong>Override Reason:</strong> {action.overrideReason}
                    <br />
                    <strong>Overridden by:</strong> {action.overriddenBy} on{' '}
                    {action.overriddenAt && new Date(action.overriddenAt).toLocaleString()}
                  </div>
                )}

                {action.status === 'active' && (
                  <button
                    onClick={() =>
                      setOverrideModal({
                        isOpen: true,
                        actionId: action._id,
                        actionType: action.actionType,
                      })
                    }
                    className="mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                  >
                    Override Action
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Override Modal */}
      {overrideModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Override {overrideModal.actionType}</h3>
            <p className="text-sm text-gray-600 mb-4">
              Provide a detailed reason for overriding this action. This will restore the vendor to
              active status and log your decision.
            </p>
            <textarea
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Enter override reason (minimum 10 characters)"
              className="w-full border border-gray-300 rounded p-2 mb-4 h-32"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setOverrideModal({ isOpen: false, actionId: null, actionType: null });
                  setOverrideReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleOverride}
                disabled={overrideReason.trim().length < 10}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Confirm Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
