import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, interactive = false, className = '', ...props }) => {
  const interactiveStyles = interactive
    ? 'cursor-pointer motion-safe:hover:-translate-y-[3px] hover:border-line-strong hover:shadow-md transition-all motion-safe:active:scale-[0.99]'
    : '';

  return (
    <div
      className={`rounded-lg border border-line bg-surface shadow-sm overflow-hidden text-left ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
