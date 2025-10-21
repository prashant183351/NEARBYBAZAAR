/**
 * Create Campaign Form
 * Wizard for creating new ad campaigns
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface Product {
	_id: string;
	name: string;
	slug: string;
	images?: string[];
	category?: string;
}

interface FormData {
	name: string;
	product: string;
	bidType: 'cpc' | 'cpm';
	bidAmount: number;
	dailyBudget: number;
	totalBudget: number;
	keywords: string[];
	placements: string[];
	targetCategories: string[];
	startDate: string;
	endDate: string;
}

export default function CreateCampaign() {
	const router = useRouter();
	const [step, setStep] = useState(1);
	const [loading, setLoading] = useState(false);
	const [products, setProducts] = useState<Product[]>([]);
	const [formData, setFormData] = useState<FormData>({
		name: '',
		product: '',
		bidType: 'cpc',
		bidAmount: 5,
		dailyBudget: 100,
		totalBudget: 1000,
		keywords: [],
		placements: ['search'],
		targetCategories: [],
		startDate: new Date().toISOString().split('T')[0],
		endDate: '',
	});
	const [keywordInput, setKeywordInput] = useState('');
	const [errors, setErrors] = useState<Record<string, string>>({});

	useEffect(() => {
		fetchProducts();
	}, []);

	const fetchProducts = async () => {
		try {
			const response = await fetch('/api/v1/products', {
				headers: {
					Authorization: `Bearer ${localStorage.getItem('token')}`,
				},
			});
			if (response.ok) {
				const result = await response.json();
				setProducts(result.data.products || []);
			}
		} catch (error) {
			console.error('Failed to fetch products:', error);
		}
	};

	const validateStep = (stepNumber: number): boolean => {
		const newErrors: Record<string, string> = {};

		if (stepNumber === 1) {
			if (!formData.name.trim()) {
				newErrors.name = 'Campaign name is required';
			}
			if (!formData.product) {
				newErrors.product = 'Please select a product';
			}
		}

		if (stepNumber === 2) {
			if (formData.bidAmount < 1) {
				newErrors.bidAmount = 'Minimum bid is ₹1';
			}
			if (formData.dailyBudget < formData.bidAmount * 10) {
				newErrors.dailyBudget = 'Daily budget should be at least 10x bid amount';
			}
			if (formData.totalBudget < formData.dailyBudget) {
				newErrors.totalBudget = 'Total budget must be >= daily budget';
			}
		}

		if (stepNumber === 3) {
			if (formData.keywords.length === 0) {
				newErrors.keywords = 'Add at least one keyword';
			}
			if (formData.placements.length === 0) {
				newErrors.placements = 'Select at least one placement';
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleNext = () => {
		if (validateStep(step)) {
			setStep(step + 1);
		}
	};

	const handleBack = () => {
		setStep(step - 1);
		setErrors({});
	};

	const handleAddKeyword = () => {
		const keyword = keywordInput.trim().toLowerCase();
		if (keyword && !formData.keywords.includes(keyword)) {
			setFormData({
				...formData,
				keywords: [...formData.keywords, keyword],
			});
			setKeywordInput('');
		}
	};

	const handleRemoveKeyword = (keyword: string) => {
		setFormData({
			...formData,
			keywords: formData.keywords.filter(k => k !== keyword),
		});
	};

	const handlePlacementToggle = (placement: string) => {
		const placements = formData.placements.includes(placement)
			? formData.placements.filter(p => p !== placement)
			: [...formData.placements, placement];
		setFormData({ ...formData, placements });
	};

	const handleSubmit = async () => {
		if (!validateStep(3)) return;

		setLoading(true);
		try {
			const response = await fetch('/api/v1/campaigns', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem('token')}`,
				},
				body: JSON.stringify(formData),
			});

			if (response.ok) {
				const result = await response.json();
				router.push(`/campaigns/${result.data.campaign._id}`);
			} else {
				const error = await response.json();
				alert(error.message || 'Failed to create campaign');
			}
		} catch (error) {
			console.error('Failed to create campaign:', error);
			alert('An error occurred. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const selectedProduct = products.find(p => p._id === formData.product);

	return (
		<div className="max-w-4xl mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-gray-900">Create Ad Campaign</h1>
				<p className="text-gray-600 mt-1">
					Set up a new advertising campaign for your products
				</p>
			</div>

			{/* Progress Steps */}
			<div className="mb-8">
				<div className="flex items-center justify-between">
					{['Basic Info', 'Budget & Bid', 'Targeting', 'Review'].map(
						(label, index) => {
							const stepNum = index + 1;
							const isActive = step === stepNum;
							const isCompleted = step > stepNum;

							return (
								<div key={label} className="flex items-center flex-1">
									<div className="flex flex-col items-center">
										<div
											className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
												isCompleted
													? 'bg-green-500 text-white'
													: isActive
													? 'bg-blue-600 text-white'
													: 'bg-gray-200 text-gray-600'
											}`}
										>
											{isCompleted ? '✓' : stepNum}
										</div>
										<p
											className={`text-sm mt-2 ${
												isActive ? 'text-blue-600 font-medium' : 'text-gray-600'
											}`}
										>
											{label}
										</p>
									</div>
									{index < 3 && (
										<div
											className={`flex-1 h-1 mx-4 ${
												isCompleted ? 'bg-green-500' : 'bg-gray-200'
											}`}
										></div>
									)}
								</div>
							);
						}
					)}
				</div>
			</div>

			{/* Form Content */}
			<div className="bg-white rounded-lg shadow p-8">
				{/* Step 1: Basic Info */}
				{step === 1 && (
					<div className="space-y-6">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Campaign Name *
							</label>
							<input
								type="text"
								value={formData.name}
								onChange={e =>
									setFormData({ ...formData, name: e.target.value })
								}
								className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
									errors.name ? 'border-red-500' : 'border-gray-300'
								}`}
								placeholder="e.g., Summer Sale Campaign"
							/>
							{errors.name && (
								<p className="text-red-500 text-sm mt-1">{errors.name}</p>
							)}
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Select Product *
							</label>
							<select
								value={formData.product}
								onChange={e =>
									setFormData({ ...formData, product: e.target.value })
								}
								className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
									errors.product ? 'border-red-500' : 'border-gray-300'
								}`}
							>
								<option value="">Choose a product...</option>
								{products.map(product => (
									<option key={product._id} value={product._id}>
										{product.name}
									</option>
								))}
							</select>
							{errors.product && (
								<p className="text-red-500 text-sm mt-1">{errors.product}</p>
							)}
							{selectedProduct && (
								<div className="mt-3 p-3 bg-gray-50 rounded-lg flex items-center gap-3">
									{selectedProduct.images?.[0] && (
										<img
											src={selectedProduct.images[0]}
											alt={selectedProduct.name}
											className="w-16 h-16 object-cover rounded"
										/>
									)}
									<div>
										<p className="font-medium">{selectedProduct.name}</p>
										<p className="text-sm text-gray-600">
											/{selectedProduct.slug}
										</p>
									</div>
								</div>
							)}
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Campaign Duration
							</label>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-xs text-gray-600 mb-1">
										Start Date
									</label>
									<input
										type="date"
										value={formData.startDate}
										onChange={e =>
											setFormData({ ...formData, startDate: e.target.value })
										}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg"
									/>
								</div>
								<div>
									<label className="block text-xs text-gray-600 mb-1">
										End Date (Optional)
									</label>
									<input
										type="date"
										value={formData.endDate}
										onChange={e =>
											setFormData({ ...formData, endDate: e.target.value })
										}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg"
										min={formData.startDate}
									/>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Step 2: Budget & Bid */}
				{step === 2 && (
					<div className="space-y-6">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Bid Type *
							</label>
							<div className="grid grid-cols-2 gap-4">
								<button
									type="button"
									onClick={() => setFormData({ ...formData, bidType: 'cpc' })}
									className={`p-4 border-2 rounded-lg text-left ${
										formData.bidType === 'cpc'
											? 'border-blue-600 bg-blue-50'
											: 'border-gray-200'
									}`}
								>
									<p className="font-bold">Cost Per Click (CPC)</p>
									<p className="text-sm text-gray-600 mt-1">
										Pay only when someone clicks your ad
									</p>
								</button>
								<button
									type="button"
									onClick={() => setFormData({ ...formData, bidType: 'cpm' })}
									className={`p-4 border-2 rounded-lg text-left ${
										formData.bidType === 'cpm'
											? 'border-blue-600 bg-blue-50'
											: 'border-gray-200'
									}`}
								>
									<p className="font-bold">Cost Per Mille (CPM)</p>
									<p className="text-sm text-gray-600 mt-1">
										Pay per 1000 impressions
									</p>
								</button>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Bid Amount (₹) *
							</label>
							<input
								type="number"
								value={formData.bidAmount}
								onChange={e =>
									setFormData({
										...formData,
										bidAmount: parseFloat(e.target.value) || 0,
									})
								}
								className={`w-full px-4 py-2 border rounded-lg ${
									errors.bidAmount ? 'border-red-500' : 'border-gray-300'
								}`}
								min="1"
								step="0.5"
							/>
							{errors.bidAmount && (
								<p className="text-red-500 text-sm mt-1">{errors.bidAmount}</p>
							)}
							<p className="text-sm text-gray-600 mt-1">
								{formData.bidType === 'cpc'
									? 'Amount you pay per click'
									: 'Amount you pay per 1000 impressions'}
							</p>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Daily Budget (₹) *
							</label>
							<input
								type="number"
								value={formData.dailyBudget}
								onChange={e =>
									setFormData({
										...formData,
										dailyBudget: parseFloat(e.target.value) || 0,
									})
								}
								className={`w-full px-4 py-2 border rounded-lg ${
									errors.dailyBudget ? 'border-red-500' : 'border-gray-300'
								}`}
								min="10"
								step="10"
							/>
							{errors.dailyBudget && (
								<p className="text-red-500 text-sm mt-1">{errors.dailyBudget}</p>
							)}
							<p className="text-sm text-gray-600 mt-1">
								Maximum spend per day (resets at midnight)
							</p>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Total Budget (₹) *
							</label>
							<input
								type="number"
								value={formData.totalBudget}
								onChange={e =>
									setFormData({
										...formData,
										totalBudget: parseFloat(e.target.value) || 0,
									})
								}
								className={`w-full px-4 py-2 border rounded-lg ${
									errors.totalBudget ? 'border-red-500' : 'border-gray-300'
								}`}
								min="100"
								step="100"
							/>
							{errors.totalBudget && (
								<p className="text-red-500 text-sm mt-1">{errors.totalBudget}</p>
							)}
							<p className="text-sm text-gray-600 mt-1">
								Campaign will stop when total budget is reached
							</p>
						</div>

						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<p className="text-sm text-blue-800">
								<strong>Estimated Performance:</strong> With ₹
								{formData.totalBudget} budget at ₹{formData.bidAmount} per{' '}
								{formData.bidType === 'cpc' ? 'click' : '1000 impressions'}, you
								could get approximately{' '}
								{formData.bidType === 'cpc'
									? Math.floor(formData.totalBudget / formData.bidAmount)
									: Math.floor(
											(formData.totalBudget / formData.bidAmount) * 1000
									  )}{' '}
								{formData.bidType === 'cpc' ? 'clicks' : 'impressions'}.
							</p>
						</div>
					</div>
				)}

				{/* Step 3: Targeting */}
				{step === 3 && (
					<div className="space-y-6">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Keywords *
							</label>
							<div className="flex gap-2 mb-2">
								<input
									type="text"
									value={keywordInput}
									onChange={e => setKeywordInput(e.target.value)}
									onKeyPress={e => {
										if (e.key === 'Enter') {
											e.preventDefault();
											handleAddKeyword();
										}
									}}
									className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
									placeholder="Enter keyword and press Enter"
								/>
								<button
									type="button"
									onClick={handleAddKeyword}
									className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
								>
									Add
								</button>
							</div>
							{errors.keywords && (
								<p className="text-red-500 text-sm mb-2">{errors.keywords}</p>
							)}
							<div className="flex flex-wrap gap-2">
								{formData.keywords.map(keyword => (
									<span
										key={keyword}
										className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm flex items-center gap-2"
									>
										{keyword}
										<button
											type="button"
											onClick={() => handleRemoveKeyword(keyword)}
											className="text-gray-600 hover:text-red-600"
										>
											×
										</button>
									</span>
								))}
							</div>
							<p className="text-sm text-gray-600 mt-2">
								Your ad will show when users search for these keywords
							</p>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Ad Placements *
							</label>
							{errors.placements && (
								<p className="text-red-500 text-sm mb-2">{errors.placements}</p>
							)}
							<div className="space-y-2">
								{[
									{
										id: 'search',
										label: 'Search Results',
										desc: 'Show in search results pages',
									},
									{
										id: 'category',
										label: 'Category Pages',
										desc: 'Show on category listing pages',
									},
									{
										id: 'homepage',
										label: 'Homepage',
										desc: 'Show on the main homepage',
									},
									{
										id: 'product_detail',
										label: 'Product Detail',
										desc: 'Show on other product pages',
									},
								].map(placement => (
									<label
										key={placement.id}
										className="flex items-start p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
									>
										<input
											type="checkbox"
											checked={formData.placements.includes(placement.id)}
											onChange={() => handlePlacementToggle(placement.id)}
											className="mt-1 mr-3"
										/>
										<div>
											<p className="font-medium">{placement.label}</p>
											<p className="text-sm text-gray-600">{placement.desc}</p>
										</div>
									</label>
								))}
							</div>
						</div>
					</div>
				)}

				{/* Step 4: Review */}
				{step === 4 && (
					<div className="space-y-6">
						<h3 className="text-xl font-bold">Review Your Campaign</h3>

						<div className="space-y-4">
							<div className="border-b pb-3">
								<p className="text-sm text-gray-600">Campaign Name</p>
								<p className="font-medium">{formData.name}</p>
							</div>

							<div className="border-b pb-3">
								<p className="text-sm text-gray-600">Product</p>
								<p className="font-medium">{selectedProduct?.name}</p>
							</div>

							<div className="border-b pb-3">
								<p className="text-sm text-gray-600">Bid Strategy</p>
								<p className="font-medium">
									₹{formData.bidAmount} {formData.bidType.toUpperCase()}
								</p>
							</div>

							<div className="border-b pb-3">
								<p className="text-sm text-gray-600">Budget</p>
								<p className="font-medium">
									₹{formData.dailyBudget}/day • ₹{formData.totalBudget} total
								</p>
							</div>

							<div className="border-b pb-3">
								<p className="text-sm text-gray-600">Keywords</p>
								<p className="font-medium">{formData.keywords.join(', ')}</p>
							</div>

							<div className="border-b pb-3">
								<p className="text-sm text-gray-600">Placements</p>
								<p className="font-medium">{formData.placements.join(', ')}</p>
							</div>

							<div>
								<p className="text-sm text-gray-600">Duration</p>
								<p className="font-medium">
									{formData.startDate}
									{formData.endDate && ` to ${formData.endDate}`}
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Navigation Buttons */}
				<div className="flex justify-between mt-8 pt-6 border-t">
					<button
						type="button"
						onClick={handleBack}
						disabled={step === 1 || loading}
						className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Back
					</button>

					{step < 4 ? (
						<button
							type="button"
							onClick={handleNext}
							className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
						>
							Next
						</button>
					) : (
						<button
							type="button"
							onClick={handleSubmit}
							disabled={loading}
							className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
						>
							{loading && (
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
							)}
							Create Campaign
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
