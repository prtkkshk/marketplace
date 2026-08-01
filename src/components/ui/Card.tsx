import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, interactive = false, className = '', ...props }) => {
  const interactiveStyles = interactive
    ? 'cursor-pointer hover:border-slate-300 transition-colors active:scale-[0.99]'
    : '';

  return (
    <div
      className={`rounded-2xl border border-surface-border bg-surface-card shadow-sm p-4 text-left ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
