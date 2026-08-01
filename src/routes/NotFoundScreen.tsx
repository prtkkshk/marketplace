import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const NotFoundScreen: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 bg-brand-wash rounded-full flex items-center justify-center mb-4 text-3xl">
        🔍
      </div>
      <h1 className="text-2xl font-bold text-content-primary mb-2">404 - Page Not Found</h1>
      <p className="text-xs text-content-muted max-w-xs mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/">
        <Button variant="primary" size="md">
          Back to Feed
        </Button>
      </Link>
    </div>
  );
};
