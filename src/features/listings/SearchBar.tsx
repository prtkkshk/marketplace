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
      <div className="flex-grow flex items-center bg-surface border border-line rounded-full pl-4 pr-1.5 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-brand/30 focus-within:border-brand transition-all">
        <Search className="w-4 h-4 text-ink-3 shrink-0" />
        <input
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent px-3 py-1 text-sm focus:outline-none text-ink placeholder:text-ink-3"
        />
        {term && (
          <button
            onClick={() => {
              setTerm('');
              onChange('');
            }}
            className="p-1 rounded-md text-ink-3 hover:text-ink shrink-0 mr-1"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
