// ...existing code...

const dummySuppliers = [
  { id: 's1', companyName: 'Acme Corp', status: 'active', products: 12 },
  { id: 's2', companyName: 'Beta Ltd', status: 'pending', products: 5 },
];

export default function SuppliersPage() {
  return (
    <div style={{ padding: 32 }}>
      <h2>Suppliers</h2>
      <table style={{ width: '100%', marginTop: 16 }}>
        <thead>
          <tr>
            <th>Company</th>
            <th>Status</th>
            <th>Products</th>
          </tr>
        </thead>
        <tbody>
          {dummySuppliers.map((s) => (
            <tr key={s.id}>
              <td>{s.companyName}</td>
              <td>{s.status}</td>
              <td>{s.products}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
