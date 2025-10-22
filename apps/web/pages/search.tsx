import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { SearchBar } from '../components/SearchBar';
import { SeoHead } from '../components/SeoHead';
import { getSearchCanonical } from '@nearbybazaar/lib/canonical';

const sampleData = [
  { type: 'product', name: 'Apple iPhone 15', slug: 'apple-iphone-15' },
  { type: 'service', name: 'AC Repair', slug: 'ac-repair' },
  { type: 'classified', name: 'Used Bike for Sale', slug: 'used-bike-for-sale' },
  { type: 'product', name: 'Samsung TV', slug: 'samsung-tv' },
  { type: 'service', name: 'Home Cleaning', slug: 'home-cleaning' },
  { type: 'classified', name: '2BHK Flat Rent', slug: '2bhk-flat-rent' },
];

const types = [
  { label: 'Products', value: 'product' },
  { label: 'Services', value: 'service' },
  { label: 'Classifieds', value: 'classified' },
];

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState(() => (router.query.q as string) || '');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(() => {
    const t = router.query.type;
    if (!t) return types.map((t) => t.value);
    return Array.isArray(t) ? t : [t];
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (selectedTypes.length !== types.length) params.set('type', selectedTypes.join(','));
    router.replace({ pathname: '/search', query: params.toString() }, undefined, { shallow: true });
     
  }, [query, selectedTypes]);

  const filtered = sampleData.filter(
    (item) =>
      selectedTypes.includes(item.type) &&
      (!query || item.name.toLowerCase().includes(query.toLowerCase())),
  );

  // Generate canonical URL with search query but without tracking params
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nearbybazaar.com';
  const canonicalUrl = getSearchCanonical(baseUrl, {
    q: query || undefined,
    type: selectedTypes.length !== types.length ? selectedTypes.join(',') : undefined,
  });

  return (
    <>
      <SeoHead
        title="Search Products & Services"
        description="Search for products, services, and classifieds on NearbyBazaar"
        canonicalUrl={canonicalUrl}
        noindex={true} // Don't index search result pages
      />
      <main style={{ padding: 32, maxWidth: 600, margin: '0 auto' }}>
        <h1>Search</h1>
        <SearchBar value={query} onChange={setQuery} onSubmit={() => {}} />
        <fieldset style={{ border: 'none', marginBottom: 16 }}>
          <legend>Filter by type:</legend>
          {types.map((t) => (
            <label key={t.value} style={{ marginRight: 16 }}>
              <input
                type="checkbox"
                checked={selectedTypes.includes(t.value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedTypes((prev) => [...prev, t.value]);
                  } else {
                    setSelectedTypes((prev) => prev.filter((v) => v !== t.value));
                  }
                }}
              />{' '}
              {t.label}
            </label>
          ))}
        </fieldset>
        <ul>
          {filtered.length === 0 && <li>No results found.</li>}
          {filtered.map((item) => (
            <li key={item.slug}>
              {item.name} <span style={{ color: '#888' }}>({item.type})</span>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
