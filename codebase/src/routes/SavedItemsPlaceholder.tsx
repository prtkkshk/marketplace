import React from 'react';
import { Card } from '../components/ui/Card';

export const SavedItemsPlaceholder: React.FC = () => {
  return (
    <div className="p-4 max-w-lg mx-auto text-left">
      <h1 className="text-lg font-bold text-ink mb-2">Saved Items</h1>
      <Card>
        <p className="text-sm font-medium text-ink">Your bookmarked listings will be listed here in Phase 6.</p>
      </Card>
    </div>
  );
};
