import React from 'react';

interface ProBadgeProps {
    show: boolean;
}

export const ProBadge: React.FC<ProBadgeProps> = ({ show }) => (
    show ? (
        <span
            className="badge pro-badge"
            aria-label="Pro Plan Vendor"
            title="Pro Plan Vendor"
            style={{ background: '#0057b8', color: '#fff', padding: '0.25em 0.75em', borderRadius: '1em', fontWeight: 600, marginLeft: 8 }}
        >
            <span aria-hidden="true" style={{ marginRight: 4 }}>⭐</span>
            Pro
        </span>
    ) : null
);
