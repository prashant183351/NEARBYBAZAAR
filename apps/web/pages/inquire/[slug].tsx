
import React, { useState } from 'react';
import { getClientFingerprint } from '../../lib/fingerprint';
import Script from 'next/script';
import { useRouter } from 'next/router';
import { useToast } from '@nearbybazaar/ui';

export default function InquireClassified() {
    const router = useRouter();
    const { slug } = router.query as { slug?: string };
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const { showToast } = useToast();
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !message) {
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
            const token = await window.grecaptcha.execute(siteKey, { action: 'inquire' });
            const fingerprint = getClientFingerprint();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/inquiry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, message, slug, recaptchaToken: token, fingerprint }),
            });
            if (res.ok) {
                setSubmitted(true);
                setError('');
                showToast('Inquiry sent!', 'success');
            } else {
                setError('Failed to send inquiry.');
                showToast('Failed to send inquiry.', 'error');
            }
        } catch {
            setError('Failed to send inquiry.');
            showToast('Failed to send inquiry.', 'error');
        }
    };

    if (submitted) {
        return (
            <main style={{ padding: 32 }}>
                <h1>Inquiry Sent</h1>
                <p>Thank you, {name}! Your inquiry for {slug} has been sent.</p>
            </main>
        );
    }

    return (
        <main style={{ padding: 32, maxWidth: 400, margin: '0 auto' }}>
            <Script
                src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
                strategy="afterInteractive"
            />
            <h1>Inquire: {slug}</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>
                        Name:
                        <input value={name} onChange={e => setName(e.target.value)} required />
                    </label>
                </div>
                <div>
                    <label>
                        Message:
                        <textarea value={message} onChange={e => setMessage(e.target.value)} required />
                    </label>
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button type="submit">Send Inquiry</button>
            </form>
        </main>
    );
}
