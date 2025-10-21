import { useState, useEffect } from 'react';

interface CreditSummary {
  credit: {
    _id: string;
    creditLimit: number;
    availableCredit: number;
    outstandingAmount: number;
    totalCreditUsed: number;
    status: 'pending' | 'approved' | 'suspended' | 'rejected';
    riskLevel: 'low' | 'medium' | 'high';
    maxNetDays: number;
    approvedAt?: string;
    defaultPaymentTermId?: {
      name: string;
      type: string;
      netDays?: number;
    };
  };
  outstandingOrders: Array<{
    _id: string;
    total: number;
    paidAmount: number;
    outstandingAmount: number;
    paymentStatus: string;
    paymentTerms?: {
      type: string;
      dueDate?: string;
    };
    createdAt: string;
  }>;
  overdueCount: number;
  utilizationPercentage: number;
}

export default function CreditDashboard() {
  const [summary, setSummary] = useState<CreditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId] = useState('USER_ID'); // TODO: Get from auth context
  const [applyingForCredit, setApplyingForCredit] = useState(false);
  
  // Application form
  const [applicationForm, setApplicationForm] = useState({
    requestedAmount: 100000,
    notes: ''
  });

  useEffect(() => {
    fetchCreditSummary();
  }, []);

  const fetchCreditSummary = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/credit/summary/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setSummary(data.data);
      } else {
        // No credit account yet
        setSummary(null);
      }
    } catch (error) {
      console.error('Failed to fetch credit summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyForCredit = async () => {
    try {
      setApplyingForCredit(true);
      const response = await fetch('/api/credit/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          requestedAmount: applicationForm.requestedAmount,
          notes: applicationForm.notes
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Credit application submitted! You will be notified once reviewed.');
        fetchCreditSummary();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to apply:', error);
      alert('Failed to submit application');
    } finally {
      setApplyingForCredit(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'rejected': return 'text-red-600';
      case 'suspended': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  // No credit account - show application form
  if (!summary) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Apply for Business Credit</h1>
        
        <div className="bg-white shadow rounded-lg p-6">
          <p className="mb-6 text-gray-600">
            Apply for credit to place orders with flexible payment terms. Our team will review your application and get back to you within 2-3 business days.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requested Credit Limit
              </label>
              <input
                type="number"
                value={applicationForm.requestedAmount}
                onChange={(e) => setApplicationForm({ ...applicationForm, requestedAmount: Number(e.target.value) })}
                className="w-full border rounded px-4 py-2"
                min="10000"
                step="10000"
              />
              <p className="text-sm text-gray-500 mt-1">
                Minimum: ₹10,000
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Details / Notes (Optional)
              </label>
              <textarea
                value={applicationForm.notes}
                onChange={(e) => setApplicationForm({ ...applicationForm, notes: e.target.value })}
                className="w-full border rounded px-4 py-2"
                rows={4}
                placeholder="Tell us about your business, expected order volume, etc."
              />
            </div>
            
            <button
              onClick={handleApplyForCredit}
              disabled={applyingForCredit || applicationForm.requestedAmount < 10000}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {applyingForCredit ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </div>
        
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Benefits of Business Credit:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>Place orders without immediate payment</li>
            <li>Flexible payment terms (Net 30, Net 60, etc.)</li>
            <li>Partial advance options for bulk orders</li>
            <li>Streamlined ordering process</li>
            <li>Better cash flow management</li>
          </ul>
        </div>
      </div>
    );
  }

  // Credit account exists - show dashboard
  const { credit, outstandingOrders, overdueCount, utilizationPercentage } = summary;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Credit Dashboard</h1>
      
      {/* Status Alert */}
      {credit.status !== 'approved' && (
        <div className={`mb-6 p-4 rounded-lg ${
          credit.status === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
          credit.status === 'rejected' ? 'bg-red-50 border border-red-200' :
          'bg-orange-50 border border-orange-200'
        }`}>
          <p className="font-semibold">
            Credit Status: <span className={getStatusColor(credit.status)}>{credit.status.toUpperCase()}</span>
          </p>
          {credit.status === 'pending' && (
            <p className="text-sm mt-1">Your credit application is under review. You'll be notified once approved.</p>
          )}
          {credit.status === 'rejected' && (
            <p className="text-sm mt-1">Your credit application was not approved. Please contact support for details.</p>
          )}
          {credit.status === 'suspended' && (
            <p className="text-sm mt-1">Your credit has been suspended. Please contact support to resolve outstanding issues.</p>
          )}
        </div>
      )}
      
      {/* Credit Overview Cards */}
      {credit.status === 'approved' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-1">Credit Limit</p>
            <p className="text-2xl font-bold">{formatCurrency(credit.creditLimit)}</p>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-1">Available Credit</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(credit.availableCredit)}</p>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-1">Outstanding Amount</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(credit.outstandingAmount)}</p>
            {overdueCount > 0 && (
              <p className="text-sm text-red-600 mt-1">{overdueCount} overdue</p>
            )}
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-1">Utilization</p>
            <p className="text-2xl font-bold">{utilizationPercentage.toFixed(1)}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${getUtilizationColor(utilizationPercentage)}`}
                style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Credit Details */}
      {credit.status === 'approved' && (
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Credit Terms</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Maximum Net Days</p>
              <p className="font-semibold">{credit.maxNetDays} days</p>
            </div>
            {credit.defaultPaymentTermId && (
              <div>
                <p className="text-sm text-gray-600">Default Payment Term</p>
                <p className="font-semibold">{credit.defaultPaymentTermId.name}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Risk Level</p>
              <p className="font-semibold capitalize">{credit.riskLevel}</p>
            </div>
          </div>
          {credit.approvedAt && (
            <p className="text-sm text-gray-500 mt-4">
              Approved on {new Date(credit.approvedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
      
      {/* Outstanding Orders */}
      {outstandingOrders.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Outstanding Orders</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {outstandingOrders.map((order) => (
                  <tr key={order._id}>
                    <td className="px-4 py-3 text-sm">
                      <a href={`/orders/${order._id}`} className="text-blue-600 hover:underline">
                        {order._id.substring(0, 8)}...
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm">{formatCurrency(order.total)}</td>
                    <td className="px-4 py-3 text-sm">{formatCurrency(order.paidAmount)}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(order.outstandingAmount)}</td>
                    <td className="px-4 py-3 text-sm">
                      {order.paymentTerms?.dueDate 
                        ? new Date(order.paymentTerms.dueDate).toLocaleDateString()
                        : 'N/A'
                      }
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        order.paymentStatus === 'overdue' ? 'bg-red-100 text-red-800' :
                        order.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {outstandingOrders.length === 0 && credit.status === 'approved' && (
        <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
          <p>No outstanding orders. Your credit is ready to use!</p>
        </div>
      )}
    </div>
  );
}
