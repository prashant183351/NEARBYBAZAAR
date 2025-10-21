import React from 'react';
import { ProBadge } from './ProBadge';

type StoreHeaderProps = {
    name: string;
    description: string;
    planTier?: string;
    logoUrl?: string;
};

export const StoreHeader: React.FC<StoreHeaderProps> = ({ name, description, planTier, logoUrl }) => (
    <header style={{ marginBottom: 32, padding: '24px 0', borderBottom: '2px solid #eee' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            {logoUrl && (
                <img
                    src={logoUrl}
                    alt={`${name} logo`}
                    style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover' }}
                />
            )}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <h1 style={{ fontSize: 32, margin: 0 }}>{name}</h1>
                    <ProBadge show={['Pro', 'Featured'].includes(planTier || '')} />
                </div>
                <p style={{ color: '#666', margin: '8px 0 0 0' }}>{description}</p>
            </div>
        </div>
    </header>
);
