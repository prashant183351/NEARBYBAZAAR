import React from 'react';

const dummyMappings = [
    { supplier: 'Acme Corp', supplierSku: 'A123', ourSku: 'NB-001' },
    { supplier: 'Beta Ltd', supplierSku: 'B456', ourSku: 'NB-002' },
];

export default function MappingsPage() {
    return (
        <div style={{ padding: 32 }}>
            <h2>SKU Mappings</h2>
            <table style={{ width: '100%', marginTop: 16 }}>
                <thead>
                    <tr>
                        <th>Supplier</th>
                        <th>Supplier SKU</th>
                        <th>Our SKU</th>
                    </tr>
                </thead>
                <tbody>
                    {dummyMappings.map(m => (
                        <tr key={m.supplierSku}>
                            <td>{m.supplier}</td>
                            <td>{m.supplierSku}</td>
                            <td>{m.ourSku}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
