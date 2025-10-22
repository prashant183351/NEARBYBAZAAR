import { useState, useEffect } from 'react';
// ...existing code...

interface ProductCardProps {
  product: any;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const showFomo =
    product.fomoEnabled &&
    typeof product.stock === 'number' &&
    typeof product.fomoThreshold === 'number' &&
    product.stock <= product.fomoThreshold;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!product.saleExpiresAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [product.saleExpiresAt]);

  let saleActive = false;
  let countdown = '';
  if (product.saleExpiresAt) {
    const expires = new Date(product.saleExpiresAt).getTime();
    if (expires > now) {
      saleActive = true;
      const diff = expires - now;
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      countdown = `${d > 0 ? d + 'd ' : ''}${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
  }

  // Bulk pricing UI
  const [qty, setQty] = useState(product.minOrderQty || 1);
  const minOrderQty = product.minOrderQty || 1;
  const tiers = Array.isArray(product.wholesalePricing) ? product.wholesalePricing : [];
  const canAddToCart = qty >= minOrderQty;

  // Find price for current qty (use best tier)
  let displayPrice = product.price;
  if (tiers.length > 0) {
    const sorted = [...tiers].sort((a, b) => b.minQty - a.minQty);
    for (const tier of sorted) {
      if (qty >= tier.minQty) {
        displayPrice = tier.price;
        break;
      }
    }
  }

  return (
    <div className="bg-white rounded shadow p-4 flex flex-col relative">
      <img
        src={product.image}
        alt={product.name}
        className="h-40 w-full object-cover rounded mb-2"
      />
      {product.wholesaleOnly && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-blue-900 text-white text-xs font-bold px-3 py-1 rounded shadow-lg z-20">
          WHOLESALE ONLY
        </div>
      )}
      {showFomo && (
        <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded shadow-lg animate-pulse z-10">
          Hurry, only {product.stock} left in stock!
        </div>
      )}
      {saleActive && (
        <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded shadow-lg z-10">
          Offer ends in {countdown}
        </div>
      )}
      <div className="font-semibold text-lg mb-1">{product.name}</div>
      <div className="text-gray-600 mb-2">
        {saleActive && product.salePrice ? (
          <>
            <span className="text-red-600 font-bold mr-2">₹{product.salePrice}</span>
            <span className="line-through text-gray-400">₹{product.price}</span>
          </>
        ) : (
          <>₹{displayPrice}</>
        )}
      </div>
      {tiers.length > 0 && (
        <div className="mb-2">
          <div className="font-semibold text-sm text-gray-700">Bulk Pricing:</div>
          <ul className="text-xs text-gray-600">
            {tiers
              .sort((a: { minQty: number }, b: { minQty: number }) => a.minQty - b.minQty)
              .map((tier: { minQty: number; price: number }, i: number) => (
                <li key={i}>
                  {tier.minQty}+: ₹{tier.price} each
                </li>
              ))}
          </ul>
          <div className="text-xs text-blue-700 mt-1">
            {tiers.map((tier: { minQty: number; price: number }, i: number) => {
              const next = tiers[i + 1];
              if (next) {
                return `Price: ₹${tier.price} each for ${tier.minQty}-${next.minQty - 1}, `;
              } else {
                return `Price: ₹${tier.price} each for ${tier.minQty}+`;
              }
            })}
          </div>
        </div>
      )}
      {product.wholesaleOnly && (
        <div className="mb-2 text-xs text-orange-700 bg-orange-50 p-2 rounded">
          This product is available for wholesale buyers only.{' '}
          <span className="font-semibold">Please log in with a business account</span> to purchase.
        </div>
      )}
      <div className="flex items-center mb-2">
        <span className="mr-2 text-sm">Qty:</span>
        <input
          type="number"
          min={minOrderQty}
          value={qty}
          onChange={(e) => setQty(Math.max(minOrderQty, Number(e.target.value)))}
          className="border rounded px-2 py-1 w-20"
        />
        {minOrderQty > 1 && <span className="ml-2 text-xs text-gray-500">(Min {minOrderQty})</span>}
      </div>
      <button
        className={`bg-blue-600 text-white px-4 py-2 rounded ${!canAddToCart ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={!canAddToCart || product.wholesaleOnly}
        // onClick={...add to cart logic...}
      >
        Add to Cart
      </button>
      {/* ...other product info... */}
    </div>
  );
};
