import React from 'react';

export interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export const SectionLabel: React.FC<SectionLabelProps> = ({ children, className = '' }) => {
  return (
    <h2 className={`text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-3 ${className}`}>
      {children}
    </h2>
  );
};
