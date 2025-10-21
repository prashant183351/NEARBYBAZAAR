import { useState } from 'react';
import { getClientFingerprint } from '../../lib/fingerprint';

const PasswordResetRequest = () => {
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		const fingerprint = await getClientFingerprint();
		await fetch('/api/auth/password-reset', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, fingerprint }),
		});
		// ...existing code...
	};

	return (
		<form onSubmit={handleSubmit}>
			<input
				type="email"
				placeholder="Enter your email"
				value={email}
				onChange={e => setEmail(e.target.value)}
				required
			/>
			<button type="submit" disabled={loading}>
				{loading ? 'Loading...' : 'Reset Password'}
			</button>
		</form>
	);
};

export default PasswordResetRequest;