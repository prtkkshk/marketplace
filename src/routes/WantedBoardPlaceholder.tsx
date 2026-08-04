import React from 'react';
import { Card } from '../components/ui/Card';

export const WantedBoardPlaceholder: React.FC = () => {
  return (
    <div className="p-4 max-w-2xl mx-auto text-left">
      <h1 className="text-xl font-bold text-ink mb-2">📢 Wanted Board</h1>
      <p className="text-xs text-ink-3 mb-4">Post what you are looking to buy from fellow KGPians.</p>
      <Card>
        <p className="text-sm font-medium text-ink">Wanted Board feed will be built in Phase 7.</p>
      </Card>
    </div>
  );
};
