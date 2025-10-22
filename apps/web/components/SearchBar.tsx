import React from 'react';

type SearchBarProps = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
};

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, onSubmit }) => (
  <form
    onSubmit={(e) => {
      e.preventDefault();
      onSubmit();
    }}
    role="search"
    style={{ display: 'flex', gap: 8, marginBottom: 16 }}
  >
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search products, services, classifieds..."
      aria-label="Search"
      style={{ flex: 1, padding: 8, fontSize: 16 }}
    />
    <button type="submit" style={{ padding: '8px 16px', fontSize: 16 }}>
      Search
    </button>
  </form>
);
