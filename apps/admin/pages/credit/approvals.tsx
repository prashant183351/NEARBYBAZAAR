import { useState, useEffect } from 'react';

interface CreditApplication {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    businessProfile?: {
      companyName?: string;
      gstin?: string;
    };
  };
  creditLimit: number;
  availableCredit: number;
  outstandingAmount: number;
  status: 'pending' | 'approved' | 'suspended' | 'rejected';
  approvedBy?: {
    name: string;
    email: string;
  };
  approvedAt?: string;
  riskLevel: 'low' | 'medium' | 'high';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentTerm {
  _id: string;
  name: string;
  type: string;
  netDays?: number;
  advancePercentage?: number;
}

export default function CreditApprovals() {
  const [applications, setApplications] = useState<CreditApplication[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedApp, setSelectedApp] = useState<CreditApplication | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [adminId] = useState('ADMIN_USER_ID'); // TODO: Get from auth context

  // Form state for approval
  const [approvalForm, setApprovalForm] = useState({
    creditLimit: 0,
    paymentTermId: '',
    maxNetDays: 30,
    riskLevel: 'medium' as 'low' | 'medium' | 'high',
  });

  // Form state for rejection
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchApplications();
    fetchPaymentTerms();
  }, [statusFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/credit/admin/applications?status=${statusFilter}`);
      const data = await response.json();

      if (data.success) {
        setApplications(data.data.applications);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentTerms = async () => {
    try {
      const response = await fetch('/api/credit/terms');
      const data = await response.json();

      if (data.success) {
        setPaymentTerms(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch payment terms:', error);
    }
  };

  const openApprovalModal = (app: CreditApplication) => {
    setSelectedApp(app);
    setApprovalForm({
      creditLimit: app.creditLimit,
      paymentTermId: '',
      maxNetDays: 30,
      riskLevel: 'medium',
    });
    setRejectionReason('');
    setShowModal(true);
  };

  const handleApprove = async () => {
    if (!selectedApp) return;

    try {
      const response = await fetch('/api/credit/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedApp.userId._id,
          approvedBy: adminId,
          creditLimit: approvalForm.creditLimit,
          paymentTermId: approvalForm.paymentTermId || undefined,
          maxNetDays: approvalForm.maxNetDays,
          riskLevel: approvalForm.riskLevel,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Credit approved successfully!');
        setShowModal(false);
        fetchApplications();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('Failed to approve credit');
    }
  };

  const handleReject = async () => {
    if (!selectedApp || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      const response = await fetch('/api/credit/admin/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedApp.userId._id,
          reason: rejectionReason,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Credit application rejected');
        setShowModal(false);
        fetchApplications();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to reject:', error);
      alert('Failed to reject application');
    }
  };

  const handleSuspend = async (app: CreditApplication) => {
    const reason = prompt('Reason for suspension:');
    if (!reason) return;

    try {
      const response = await fetch('/api/credit/admin/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: app.userId._id,
          reason,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Credit suspended');
        fetchApplications();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to suspend:', error);
      alert('Failed to suspend credit');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Credit Approvals</h1>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-4 py-2"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
            <option value="">All</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No applications found</div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Buyer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied On
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map((app) => (
                <tr key={app._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {app.userId.businessProfile?.companyName || app.userId.name}
                    </div>
                    <div className="text-sm text-gray-500">{app.userId.email}</div>
                    {app.userId.businessProfile?.gstin && (
                      <div className="text-xs text-gray-400">
                        GSTIN: {app.userId.businessProfile.gstin}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(app.creditLimit)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskBadgeColor(app.riskLevel)}`}
                    >
                      {app.riskLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(app.status)}`}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {app.status === 'pending' && (
                      <button
                        onClick={() => openApprovalModal(app)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Review
                      </button>
                    )}
                    {app.status === 'approved' && (
                      <button
                        onClick={() => handleSuspend(app)}
                        className="text-orange-600 hover:text-orange-900"
                      >
                        Suspend
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Approval/Rejection Modal */}
      {showModal && selectedApp && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Review Credit Application
              </h3>

              <div className="mb-4 p-4 bg-gray-50 rounded">
                <p>
                  <strong>Buyer:</strong>{' '}
                  {selectedApp.userId.businessProfile?.companyName || selectedApp.userId.name}
                </p>
                <p>
                  <strong>Email:</strong> {selectedApp.userId.email}
                </p>
                {selectedApp.userId.businessProfile?.gstin && (
                  <p>
                    <strong>GSTIN:</strong> {selectedApp.userId.businessProfile.gstin}
                  </p>
                )}
                <p>
                  <strong>Requested Amount:</strong> {formatCurrency(selectedApp.creditLimit)}
                </p>
                {selectedApp.notes && (
                  <p>
                    <strong>Notes:</strong> {selectedApp.notes}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Approved Credit Limit
                  </label>
                  <input
                    type="number"
                    value={approvalForm.creditLimit}
                    onChange={(e) =>
                      setApprovalForm({ ...approvalForm, creditLimit: Number(e.target.value) })
                    }
                    className="w-full border rounded px-3 py-2"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Payment Term (Optional)
                  </label>
                  <select
                    value={approvalForm.paymentTermId}
                    onChange={(e) =>
                      setApprovalForm({ ...approvalForm, paymentTermId: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">-- Select --</option>
                    {paymentTerms.map((term) => (
                      <option key={term._id} value={term._id}>
                        {term.name} ({term.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Net Days
                  </label>
                  <input
                    type="number"
                    value={approvalForm.maxNetDays}
                    onChange={(e) =>
                      setApprovalForm({ ...approvalForm, maxNetDays: Number(e.target.value) })
                    }
                    className="w-full border rounded px-3 py-2"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
                  <select
                    value={approvalForm.riskLevel}
                    onChange={(e) =>
                      setApprovalForm({ ...approvalForm, riskLevel: e.target.value as any })
                    }
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rejection Reason (if rejecting)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                    placeholder="Provide reason for rejection..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  disabled={!rejectionReason.trim()}
                >
                  Reject
                </button>
                <button
                  onClick={handleApprove}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
