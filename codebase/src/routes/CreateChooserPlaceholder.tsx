import React from 'react';
import { Card } from '../components/ui/Card';

export const CreateChooserPlaceholder: React.FC = () => {
  return (
    <div className="p-4 max-w-md mx-auto text-left">
      <h1 className="text-xl font-bold text-ink mb-2">➕ Post an Item or Request</h1>
      <p className="text-xs text-ink-3 mb-4">Choose whether to sell an item or post a wanted request.</p>
      <div className="flex flex-col gap-3">
        <Card interactive>
          <span className="text-2xl mb-1 block">🚲</span>
          <h2 className="text-sm font-bold text-ink">Sell an Item</h2>
          <p className="text-xs text-ink-3">Post a cycle, book, electronics, or room essential.</p>
        </Card>

        <Card interactive>
          <span className="text-2xl mb-1 block">📢</span>
          <h2 className="text-sm font-bold text-ink">Post a Wanted Request</h2>
          <p className="text-xs text-ink-3">Let campus know what you are looking for.</p>
        </Card>
      </div>
    </div>
  );
};
