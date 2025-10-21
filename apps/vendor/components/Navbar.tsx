import React from 'react';
import { Button } from '@nearbybazaar/ui';

export const Navbar: React.FC = () => (
    <nav style={{ display: 'flex', alignItems: 'center', padding: '1rem', background: 'var(--nbz-primary)', color: '#fff' }}>
        <span style={{ fontWeight: 700, fontSize: 20, marginRight: 'auto' }}>NearbyBazaar Vendor</span>
        <Button variant="secondary">Dashboard</Button>
        <Button style={{ marginLeft: 8 }}>Logout</Button>
    </nav>
);
