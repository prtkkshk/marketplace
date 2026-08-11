import React from 'react';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { LogOut } from 'lucide-react';

export interface ExitPromptSheetProps {
  isOpen: boolean;
  isFallback?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ExitPromptSheet: React.FC<ExitPromptSheetProps> = ({
  isOpen,
  isFallback,
  onClose,
  onConfirm,
}) => {
  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="Exit KGP Bazaar">
      <div className="text-center py-4 flex flex-col items-center">
        <div className="w-12 h-12 rounded-2xl bg-danger-wash text-danger flex items-center justify-center mb-4">
          <LogOut className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-ink mb-2">
          {isFallback ? 'App is still running' : 'Are you sure you want to leave?'}
        </h3>
        <p className="text-sm text-subtle mb-8">
          {isFallback 
            ? 'Press your device back button again or swipe home to exit.' 
            : 'You are about to exit the application.'}
        </p>

        <div className="w-full flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            {isFallback ? 'Close' : 'Stay'}
          </Button>
          {!isFallback && (
            <Button variant="primary" className="flex-1 bg-danger hover:bg-danger text-white border-danger hover:border-danger" onClick={onConfirm}>
              Exit App
            </Button>
          )}
        </div>
      </div>
    </Sheet>
  );
};
