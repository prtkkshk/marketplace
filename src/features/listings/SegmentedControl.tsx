import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface SegmentedControlProps {
  activeSegment: 'sale' | 'wanted';
  onChange: (segment: 'sale' | 'wanted') => void;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({ activeSegment, onChange }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative flex w-full p-1 bg-slate-200/60 rounded-xl mb-4">
      <button
        onClick={() => onChange('sale')}
        className={`relative flex-1 py-2 text-xs font-semibold text-center transition-colors z-10 ${
          activeSegment === 'sale' ? 'text-brand-primary' : 'text-content-muted hover:text-content-primary'
        }`}
      >
        <span>🛍️ For Sale</span>
        {activeSegment === 'sale' && !shouldReduceMotion && (
          <motion.div
            layoutId="segmented-tab-indicator"
            className="absolute inset-0 bg-white rounded-lg shadow-xs -z-10"
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          />
        )}
      </button>

      <button
        onClick={() => onChange('wanted')}
        className={`relative flex-1 py-2 text-xs font-semibold text-center transition-colors z-10 ${
          activeSegment === 'wanted' ? 'text-brand-primary' : 'text-content-muted hover:text-content-primary'
        }`}
      >
        <span>📢 Wanted Board</span>
        {activeSegment === 'wanted' && !shouldReduceMotion && (
          <motion.div
            layoutId="segmented-tab-indicator"
            className="absolute inset-0 bg-white rounded-lg shadow-xs -z-10"
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          />
        )}
      </button>
    </div>
  );
};
