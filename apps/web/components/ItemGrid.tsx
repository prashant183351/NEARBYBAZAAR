import React from 'react';
import Link from 'next/link';

type Item = {
  _id: string;
  name: string;
  slug: string;
  price?: number;
  currency?: string;
  description?: string;
  media?: string[];
};

type ItemGridProps = {
  items: Item[];
  type: 'products' | 'services' | 'classifieds' | 'product' | 'service' | 'classified';
};

export const ItemGrid: React.FC<ItemGridProps> = ({ items, type }) => {
  // Normalize type to singular form for URL paths
  const pathType = type.endsWith('s') ? type.slice(0, -1) : type;
  const pathPrefix = pathType === 'product' ? 'p' : pathType === 'service' ? 's' : 'c';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 24,
      }}
    >
      {items.map((item) => (
        <Link
          key={item._id}
          href={`/${pathPrefix}/${item.slug}`}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div
            style={{
              border: '1px solid #eee',
              borderRadius: 8,
              padding: 16,
              background: '#fff',
              cursor: 'pointer',
              transition: 'box-shadow 0.2s',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {item.media && item.media[0] && (
              <img
                src={item.media[0]}
                alt={item.name}
                style={{
                  width: '100%',
                  height: 180,
                  objectFit: 'cover',
                  borderRadius: 4,
                  marginBottom: 12,
                }}
              />
            )}
            <h3 style={{ fontSize: 18, margin: '0 0 8px 0', fontWeight: 600 }}>{item.name}</h3>
            {item.description && (
              <p
                style={{
                  fontSize: 14,
                  color: '#666',
                  margin: '0 0 12px 0',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {item.description}
              </p>
            )}
            {item.price !== undefined && (
              <div style={{ fontWeight: 'bold', fontSize: 16, color: '#000' }}>
                {item.currency || 'INR'} {item.price.toLocaleString()}
              </div>
            )}
            <button
              style={{
                marginTop: 12,
                padding: '10px 16px',
                background: '#000',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {pathType === 'product'
                ? 'View Details'
                : pathType === 'service'
                  ? 'Book Now'
                  : 'Inquire'}
            </button>
          </div>
        </Link>
      ))}
    </div>
  );
};
