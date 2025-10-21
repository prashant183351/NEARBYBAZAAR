import React, { useEffect, useState } from 'react';

interface VendorAction {
	_id: string;
	actionType: 'warning' | 'temp_suspend' | 'permanent_block';
	reason: string;
	status: 'pending' | 'active' | 'overridden' | 'expired';
	triggeredBy: 'system' | 'admin';
	metrics: {
		orderDefectRate: number;
		lateShipmentRate: number;
		cancellationRate: number;
		totalOrders: number;
	};
	expiresAt?: string;
	createdAt: string;
}

interface OrderAcceptanceStatus {
	canAccept: boolean;
	reason?: string;
	action?: VendorAction;
}

export default function VendorActionsPage() {
	const [actions, setActions] = useState<VendorAction[]>([]);
	const [orderStatus, setOrderStatus] = useState<OrderAcceptanceStatus | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchMyActions();
		fetchOrderAcceptanceStatus();
	}, []);

	const fetchMyActions = async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await fetch('/v1/vendor-actions/my-actions');
			const data = await response.json();
			if (data.success) {
				setActions(data.data);
			} else {
				setError(data.error || 'Failed to fetch actions');
			}
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const fetchOrderAcceptanceStatus = async () => {
		try {
			const response = await fetch('/v1/vendor-actions/can-accept-orders');
			const data = await response.json();
			if (data.success) {
				setOrderStatus(data.data);
			}
		} catch (err: any) {
			console.error('Failed to fetch order acceptance status:', err);
		}
	};

	const getActionIcon = (actionType: string) => {
		switch (actionType) {
			case 'warning':
				return '⚠️';
			case 'temp_suspend':
				return '⏸️';
			case 'permanent_block':
				return '🚫';
			default:
				return '❓';
		}
	};

	const getActionColor = (actionType: string) => {
		switch (actionType) {
			case 'warning':
				return 'border-yellow-400 bg-yellow-50';
			case 'temp_suspend':
				return 'border-orange-400 bg-orange-50';
			case 'permanent_block':
				return 'border-red-400 bg-red-50';
			default:
				return 'border-gray-400 bg-gray-50';
		}
	};

	const getActionTitle = (actionType: string) => {
		switch (actionType) {
			case 'warning':
				return 'Performance Warning';
			case 'temp_suspend':
				return 'Temporary Suspension';
			case 'permanent_block':
				return 'Account Blocked';
			default:
				return 'Action';
		}
	};

	const activeActions = actions.filter((a) => a.status === 'active');
	const historicalActions = actions.filter((a) => a.status !== 'active');

	if (loading) {
		return (
			<div className="p-6 max-w-4xl mx-auto">
				<div className="flex items-center justify-center h-64">
					<div className="text-gray-500">Loading...</div>
				</div>
			</div>
		);
	}

	return (
		<div className="p-6 max-w-4xl mx-auto">
			<h1 className="text-3xl font-bold mb-6">Account Status & Actions</h1>

			{error && (
				<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
					{error}
				</div>
			)}

			{/* Order Acceptance Status */}
			{orderStatus && (
				<div
					className={`border-l-4 p-4 mb-6 ${
						orderStatus.canAccept
							? 'border-green-500 bg-green-50'
							: 'border-red-500 bg-red-50'
					}`}
				>
					<h2 className="text-lg font-semibold mb-2">
						{orderStatus.canAccept ? '✅ Account Active' : '🚫 Orders Restricted'}
					</h2>
					<p className="text-sm">
						{orderStatus.canAccept
							? 'Your account is in good standing. You can accept new orders.'
							: orderStatus.reason || 'Your account is currently restricted from accepting new orders.'}
					</p>
				</div>
			)}

			{/* Active Actions */}
			{activeActions.length > 0 && (
				<div className="mb-6">
					<h2 className="text-xl font-semibold mb-4">Active Actions</h2>
					<div className="space-y-4">
						{activeActions.map((action) => (
							<div
								key={action._id}
								className={`border-2 rounded-lg p-6 ${getActionColor(action.actionType)}`}
							>
								<div className="flex items-start space-x-4">
									<div className="text-4xl">{getActionIcon(action.actionType)}</div>
									<div className="flex-1">
										<h3 className="text-lg font-semibold mb-2">
											{getActionTitle(action.actionType)}
										</h3>
										<p className="text-sm mb-4">{action.reason}</p>

										<div className="bg-white bg-opacity-50 rounded p-3 mb-4">
											<h4 className="text-xs font-semibold mb-2">Performance Metrics</h4>
											<div className="grid grid-cols-3 gap-2 text-xs">
												<div>
													<div className="text-gray-600">Order Defect Rate</div>
													<div className="font-semibold">
														{(action.metrics.orderDefectRate * 100).toFixed(2)}%
													</div>
												</div>
												<div>
													<div className="text-gray-600">Late Shipment Rate</div>
													<div className="font-semibold">
														{(action.metrics.lateShipmentRate * 100).toFixed(2)}%
													</div>
												</div>
												<div>
													<div className="text-gray-600">Cancellation Rate</div>
													<div className="font-semibold">
														{(action.metrics.cancellationRate * 100).toFixed(2)}%
													</div>
												</div>
											</div>
										</div>

										<div className="flex justify-between items-center text-xs text-gray-600">
											<div>
												Issued: {new Date(action.createdAt).toLocaleDateString()}
											</div>
											{action.expiresAt && (
												<div className="font-semibold text-orange-600">
													Expires: {new Date(action.expiresAt).toLocaleDateString()}
												</div>
											)}
										</div>
									</div>
								</div>

								{/* Action-specific guidance */}
								<div className="mt-4 p-3 bg-white rounded text-sm">
									<h4 className="font-semibold mb-2">What should I do?</h4>
									{action.actionType === 'warning' && (
										<ul className="list-disc list-inside space-y-1 text-gray-700">
											<li>Review your recent orders and customer feedback</li>
											<li>Ensure products are shipped on time</li>
											<li>Maintain accurate product descriptions and inventory</li>
											<li>Respond promptly to customer inquiries and issues</li>
											<li>Monitor your metrics dashboard daily</li>
										</ul>
									)}
									{action.actionType === 'temp_suspend' && (
										<div className="text-gray-700">
											<p className="mb-2">
												Your account is temporarily suspended from accepting new orders.
												This suspension will automatically expire on{' '}
												{action.expiresAt &&
													new Date(action.expiresAt).toLocaleDateString()}
												.
											</p>
											<p className="mb-2 font-semibold">To improve your standing:</p>
											<ul className="list-disc list-inside space-y-1">
												<li>Complete all pending orders successfully</li>
												<li>Resolve any open disputes or customer issues</li>
												<li>Review and improve your operational processes</li>
												<li>Contact support if you need assistance</li>
											</ul>
										</div>
									)}
									{action.actionType === 'permanent_block' && (
										<div className="text-gray-700">
											<p className="mb-2">
												Your account has been permanently blocked from accepting new
												orders due to severe or repeated policy violations.
											</p>
											<p>
												If you believe this is in error or would like to appeal, please
												contact support at{' '}
												<a
													href="mailto:vendor-support@nearbybazaar.com"
													className="text-blue-600 underline"
												>
													vendor-support@nearbybazaar.com
												</a>
											</p>
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* No Active Actions */}
			{activeActions.length === 0 && (
				<div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
					<div className="flex items-center space-x-3">
						<div className="text-3xl">✅</div>
						<div>
							<h3 className="text-lg font-semibold text-green-800">
								Great! No active actions
							</h3>
							<p className="text-sm text-green-700">
								Your account is in good standing. Keep up the excellent service!
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Historical Actions */}
			{historicalActions.length > 0 && (
				<div>
					<h2 className="text-xl font-semibold mb-4">Action History</h2>
					<div className="space-y-3">
						{historicalActions.map((action) => (
							<div key={action._id} className="border border-gray-200 rounded-lg p-4">
								<div className="flex justify-between items-start">
									<div>
										<span className="text-sm font-medium">
											{getActionTitle(action.actionType)}
										</span>
										<span
											className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
												action.status === 'overridden'
													? 'bg-green-100 text-green-800'
													: 'bg-gray-100 text-gray-800'
											}`}
										>
											{action.status}
										</span>
									</div>
									<div className="text-xs text-gray-500">
										{new Date(action.createdAt).toLocaleDateString()}
									</div>
								</div>
								<p className="text-sm text-gray-600 mt-2">{action.reason}</p>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
