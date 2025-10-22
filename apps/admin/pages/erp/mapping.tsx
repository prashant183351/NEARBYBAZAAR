import { useState } from 'react';
// ...existing code...

const internalFields = ['OrderID', 'CustomerName', 'CustomerEmail', 'Items', 'Total', 'Date'];
const erpFields = [
  'ERP_Order_ID',
  'ERP_Customer_Name',
  'ERP_Customer_Email',
  'ERP_Items',
  'ERP_Total',
  'ERP_Date',
];

export default function ERPFieldMappingPage() {
  const [mapping, setMapping] = useState<{ [key: string]: string }>({});
  const [sampleData] = useState({
    OrderID: '123',
    CustomerName: 'Alice',
    CustomerEmail: 'alice@example.com',
    Items: 'SKU1:2,SKU2:1',
    Total: '150.00',
    Date: '2025-10-19',
  });
  const [preview, setPreview] = useState<any>(null);

  const handleMapChange = (internal: string, erp: string) => {
    setMapping((prev) => ({ ...prev, [internal]: erp }));
  };

  const handlePreview = () => {
    // Map sample data using current mapping
    const mapped = Object.fromEntries(
      Object.entries(sampleData).map(([key, value]) => [mapping[key] || key, value]),
    );
    setPreview(mapped);
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 32 }}>
      <h2>ERP Field Mapping</h2>
      <table style={{ width: '100%', marginBottom: 24 }}>
        <thead>
          <tr>
            <th>Internal Field</th>
            <th>ERP Field</th>
          </tr>
        </thead>
        <tbody>
          {internalFields.map((field) => (
            <tr key={field}>
              <td>{field}</td>
              <td>
                <select
                  value={mapping[field] || ''}
                  onChange={(e) => handleMapChange(field, e.target.value)}
                >
                  <option value="">(same as internal)</option>
                  {erpFields.map((erp) => (
                    <option key={erp} value={erp}>
                      {erp}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handlePreview} style={{ marginBottom: 16 }}>
        Preview Mapping
      </button>
      {preview && (
        <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 8 }}>
          <h4>Mapped Sample Data</h4>
          <pre>{JSON.stringify(preview, null, 2)}</pre>
        </div>
      )}
      {/* TODO: Add save logic (per vendor/global) */}
    </div>
  );
}
