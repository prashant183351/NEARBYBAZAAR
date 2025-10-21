import React, { useState } from 'react';
import QRCode from 'qrcode.react';

interface ShareProps {
    url: string;
    title?: string;
    text?: string;
    utmSource?: string;
}

export const Share: React.FC<ShareProps> = ({ url, title, text, utmSource = 'share_button' }) => {
    const [showQR, setShowQR] = useState(false);
    const [copied, setCopied] = useState(false);

    // Append UTM parameters for tracking
    const shareUrl = `${url}${url.includes('?') ? '&' : '?'}utm_source=${encodeURIComponent(utmSource)}`;

    // Web Share API (mobile)
    const handleWebShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title || 'Check this out!',
                    text: text || '',
                    url: shareUrl,
                });
            } catch (err) {
                // fallback if cancelled
            }
        }
    };

    // Copy link
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            setCopied(false);
        }
    };

    // WhatsApp share
    const handleWhatsApp = () => {
        const waUrl = `https://wa.me/?text=${encodeURIComponent(text ? text + ' ' : '')}${encodeURIComponent(shareUrl)}`;
        window.open(waUrl, '_blank');
    };

    return (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* Web Share API (mobile) */}
            {'share' in navigator ? (
                <button onClick={handleWebShare} title="Share">
                    <span role="img" aria-label="Share">🔗</span> Share
                </button>
            ) : null}
            {/* Copy link */}
            <button onClick={handleCopy} title="Copy link">
                <span role="img" aria-label="Copy">📋</span> {copied ? 'Copied!' : 'Copy Link'}
            </button>
            {/* WhatsApp */}
            <button onClick={handleWhatsApp} title="Share on WhatsApp">
                <span role="img" aria-label="WhatsApp">🟢</span> WhatsApp
            </button>
            {/* QR Code */}
            <button onClick={() => setShowQR(!showQR)} title="Show QR Code">
                <span role="img" aria-label="QR">🔳</span> QR
            </button>
            {showQR && (
                <div style={{ position: 'absolute', background: '#fff', border: '1px solid #ddd', padding: 16, zIndex: 10 }}>
                    <QRCode value={shareUrl} size={128} />
                    <div style={{ textAlign: 'center', marginTop: 8 }}>
                        <button onClick={() => setShowQR(false)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};
