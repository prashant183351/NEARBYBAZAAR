
import React, { useState } from 'react';
import { getClientFingerprint } from '../../lib/fingerprint';
import Script from 'next/script';
import { useRouter } from 'next/router';
import { useToast } from '@nearbybazaar/ui';

export default function BookService() {
    const router = useRouter();
    const { slug } = router.query as { slug?: string };
    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const { showToast } = useToast();
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !date) {
            setError('Please fill all fields.');
            return;
        }
        try {
            const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || (window as any).NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
            // @ts-ignore
            if (!window.grecaptcha) {
                setError('reCAPTCHA not loaded');
                return;
            }
            // @ts-ignore
            const token = await window.grecaptcha.execute(siteKey, { action: 'booking' });
            const fingerprint = getClientFingerprint();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/booking`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, date, slug, recaptchaToken: token, fingerprint }),
            });
            if (res.ok) {
                setSubmitted(true);
                setError('');
                showToast('Booking submitted!', 'success');
            } else {
                setError('Failed to submit booking.');
                showToast('Failed to submit booking.', 'error');
            }
        } catch {
            setError('Failed to submit booking.');
            showToast('Failed to submit booking.', 'error');
        }
    };

    if (submitted) {
        return (
            <main style={{ padding: 32 }}>
                <h1>Booking Confirmed</h1>
                <p>Thank you, {name}! Your booking for {slug} on {date} is confirmed.</p>
            </main>
        );
    }

    return (
        <main style={{ padding: 32, maxWidth: 400, margin: '0 auto' }}>
            <Script
                src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
                strategy="afterInteractive"
            />
            <h1>Book Service: {slug}</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>
                        Name:
                        <input value={name} onChange={e => setName(e.target.value)} required />
                    </label>
                </div>
                <div>
                    <label>
                        Date:
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                    </label>
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button type="submit">Book</button>
            </form>
        </main>
    );
}
