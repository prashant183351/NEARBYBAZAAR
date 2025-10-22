import { useState, useEffect } from 'react';
// ...existing code...

interface ComparisonItem {
  itemId: string;
  itemType: 'product' | 'service' | 'property';
}

const ComparisonTray = () => {
  const [comparisonItems, setComparisonItems] = useState<ComparisonItem[]>([]);

  useEffect(() => {
    // Fetch comparison items for the user
    const fetchComparisonItems = async () => {
      try {
        const response = await fetch('/api/compare/{userId}');
        const data = await response.json();
        if (data.success) {
          setComparisonItems(data.comparison.items);
        }
      } catch (error) {
        console.error('Error fetching comparison items:', error);
      }
    };

    fetchComparisonItems();
  }, []);

  return (
    <div>
      <h2>Comparison Tray</h2>
      {comparisonItems.length === 0 ? (
        <p>No items in the comparison tray.</p>
      ) : (
        <ul>
          {comparisonItems.map((item, index) => (
            <li key={index}>
              {item.itemType}: {item.itemId}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ComparisonTray;
