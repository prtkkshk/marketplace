import React from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';

export const RequestDetailPlaceholder: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-4 max-w-lg mx-auto text-left">
      <h1 className="text-lg font-bold text-ink mb-2">Wanted Request Detail</h1>
      <Card>
        <p className="text-sm font-medium text-ink">Request ID: {id}</p>
        <p className="text-xs text-ink-3 mt-1">Request detail & responder contact will be built in Phase 7.</p>
      </Card>
    </div>
  );
};
