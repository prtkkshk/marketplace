import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value: externalValue,
  onChange,
  placeholder = 'Search cycles, books, electronics...',
  className = '',
}) => {
  const [term, setTerm] = useState<string>(externalValue);

  useEffect(() => {
    setTerm(externalValue);
  }, [externalValue]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (term !== externalValue) {
        onChange(term);
      }
    }, 250);

    return () => clearTimeout(handler);
  }, [term, externalValue, onChange]);

  return (
    <div className={`relative w-full ${className}`}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none" />
      <input
        type="text"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 pl-10 pr-9 py-2 rounded-full border border-line bg-surface text-ink text-sm placeholder:text-ink-3/60 focus:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15 transition-colors shadow-1"
      />
      {term && (
        <button
          onClick={() => {
            setTerm('');
            onChange('');
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-ink-3 hover:text-ink"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
