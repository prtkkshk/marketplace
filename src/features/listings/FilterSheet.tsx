import React, { useState, useEffect } from 'react';
import { Sheet } from '../../components/ui/Sheet';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { KGP_HALLS, CONDITIONS } from '../../lib/constants';

export interface FilterState {
  condition?: string;
  isNegotiable?: boolean;
  hall?: string;
  maxPrice?: number;
}

export interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  onReset: () => void;
}

export const FilterSheet: React.FC<FilterSheetProps> = ({
  isOpen,
  onClose,
  filters,
  onApply,
  onReset,
}) => {
  const [condition, setCondition] = useState<string>(filters.condition || 'all');
  const [hall, setHall] = useState<string>(filters.hall || 'all');
  const [isNegotiable, setIsNegotiable] = useState<boolean>(!!filters.isNegotiable);
  const [maxPrice, setMaxPrice] = useState<string>(filters.maxPrice ? String(filters.maxPrice) : '');

  useEffect(() => {
    setCondition(filters.condition || 'all');
    setHall(filters.hall || 'all');
    setIsNegotiable(!!filters.isNegotiable);
    setMaxPrice(filters.maxPrice ? String(filters.maxPrice) : '');
  }, [filters, isOpen]);

  const handleApply = () => {
    onApply({
      condition: condition === 'all' ? undefined : condition,
      hall: hall === 'all' ? undefined : hall,
      isNegotiable: isNegotiable ? true : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
    });
    onClose();
  };

  const handleReset = () => {
    setCondition('all');
    setHall('all');
    setIsNegotiable(false);
    setMaxPrice('');
    onReset();
    onClose();
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="Filter Listings">
      <div className="flex flex-col gap-4 py-2">
        <Select
          label="Item Condition"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          options={[{ value: 'all', label: 'All Conditions' }, ...CONDITIONS.map((c) => ({ value: c.id, label: c.label }))]}
        />

        <Select
          label="Seller's Hall of Residence"
          value={hall}
          onChange={(e) => setHall(e.target.value)}
          options={[{ value: 'all', label: 'All Halls' }, ...KGP_HALLS.map((h) => ({ value: h, label: `${h} Hall` }))]}
        />

        <Input
          label="Max Price (₹)"
          placeholder="e.g. 5000"
          type="number"
          min={0}
          max={500000}
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />

        <div className="flex items-center gap-2 mt-1">
          <input
            type="checkbox"
            id="filter-negotiable"
            checked={isNegotiable}
            onChange={(e) => setIsNegotiable(e.target.checked)}
            className="w-4 h-4 rounded text-brand-primary focus:ring-brand-light"
          />
          <label htmlFor="filter-negotiable" className="text-sm font-medium text-content-primary cursor-pointer">
            Negotiable Price Only
          </label>
        </div>

        <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-surface-border">
          <Button variant="outline" onClick={handleReset}>
            Reset Filters
          </Button>
          <Button variant="primary" onClick={handleApply}>
            Apply Filters
          </Button>
        </div>
      </div>
    </Sheet>
  );
};
