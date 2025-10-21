import React, { useEffect, useState } from 'react';

interface Plan {
    name: string;
    tier: string;
    maxListings: number;
    features: string[];
    price: number;
    currency: string;
}

interface Usage {
    listingsUsed: number;
}

export default function VendorPlanPage() {
    const [plan, setPlan] = useState<Plan | null>(null);
    const [usage, setUsage] = useState<Usage>({ listingsUsed: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPlan() {
            try {
                const planRes = await fetch('/api/vendor/plan');
                if (planRes.ok) {
                    const planJson = await planRes.json();
                    setPlan(planJson.plan || null);
                }
                const usageRes = await fetch('/api/vendor/usage');
                if (usageRes.ok) {
                    const usageJson = await usageRes.json();
                    setUsage(usageJson.usage || { listingsUsed: 0 });
                }
            } finally {
                setLoading(false);
            }
        }
        fetchPlan();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (!plan) return <div>No plan found.</div>;

    const quotaPct = Math.min(100, Math.round((usage.listingsUsed / plan.maxListings) * 100));
    const upgradeNeeded = plan.tier === 'Free';

    return (
        <div style={{ maxWidth: 500, margin: '2em auto', padding: '2em', border: '1px solid #eee', borderRadius: 8 }}>
            <h2>Your Current Plan</h2>
            <div><strong>{plan.name}</strong> ({plan.tier})</div>
            <div>Listings used: {usage.listingsUsed} / {plan.maxListings}</div>
            <div style={{ background: '#eee', borderRadius: 4, height: 16, margin: '8px 0', width: '100%' }}>
                <div style={{ background: '#1fa463', height: '100%', width: `${quotaPct}%`, borderRadius: 4 }} />
            </div>
            <div>Features: {plan.features.join(', ') || 'None'}</div>
            <div>Price: {plan.price} {plan.currency}</div>
            {upgradeNeeded && (
                <button style={{ marginTop: 16, background: '#f90', color: '#fff', padding: '0.5em 1.5em', border: 'none', borderRadius: 4, fontWeight: 600 }}>
                    Upgrade Plan
                </button>
            )}
        </div>
    );
}
