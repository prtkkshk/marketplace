import React from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';

export const ListingDetailPlaceholder: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-4 max-w-lg mx-auto text-left">
      <h1 className="text-lg font-bold text-ink mb-2">Listing Detail</h1>
      <Card>
        <p className="text-sm font-medium text-ink">Listing ID: {id}</p>
        <p className="text-xs text-ink-3 mt-1">Full detail carousel & WhatsApp contact will be built in Phase 4 & 6.</p>
      </Card>
    </div>
  );
};
