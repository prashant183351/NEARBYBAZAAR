import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function RecommendationDashboard() {
	const [data, setData] = useState<any>(null);
	useEffect(() => {
		axios.get('/api/vendor/recommendation-metrics').then(r => setData(r.data));
	}, []);
	if (!data) return <div>Loading...</div>;
	return (
		<div>
			<h2>Recommendation Performance</h2>
			<table>
				<thead>
					<tr><th>Product</th><th>Recommended</th><th>CTR</th><th>Sales</th></tr>
				</thead>
				<tbody>
					{data.products.map((p: any) => (
						<tr key={p.id}><td>{p.name}</td><td>{p.recommended}</td><td>{p.ctr}%</td><td>{p.sales}</td></tr>
					))}
				</tbody>
			</table>
			<h3>A/B Test Results</h3>
			<table>
				<thead><tr><th>Test</th><th>Variant</th><th>CTR</th><th>Sales</th></tr></thead>
				<tbody>
					{data.abTests.map((t: any) => (
						<tr key={t.test+"-"+t.variant}><td>{t.test}</td><td>{t.variant}</td><td>{t.ctr}%</td><td>{t.sales}</td></tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
