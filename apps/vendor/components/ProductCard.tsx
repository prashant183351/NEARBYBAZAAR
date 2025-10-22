import React from 'react';
import { BestPriceBadge } from './BestPriceBadge';

interface ProductCardProps {
  product: any;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  // Example: commission = 0 or has discount flag
  const showBestPrice = product.commission === 0 || product.discounted === true;
  let reason = '';
  if (product.commission === 0) reason = 'No platform commission';
  else if (product.discounted) reason = 'Platform discount';

  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <p>Price: ₹{product.price}</p>
      {showBestPrice && <BestPriceBadge reason={reason} />}
    </div>
  );
};
