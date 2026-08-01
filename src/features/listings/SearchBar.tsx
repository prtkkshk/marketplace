import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value: externalValue,
  onChange,
  placeholder = 'Search cycles, books, electronics...',
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
    <div className="relative w-full">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
      <input
        type="text"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-[44px] pl-10 pr-9 py-2 rounded-xl border border-surface-border bg-white text-content-primary text-sm placeholder:text-content-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-light transition-colors"
      />
      {term && (
        <button
          onClick={() => {
            setTerm('');
            onChange('');
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-content-muted hover:text-content-primary"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
