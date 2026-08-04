import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, interactive = false, className = '', ...props }) => {
  const interactiveStyles = interactive
    ? 'cursor-pointer hover:-translate-y-[3px] hover:border-line-strong hover:shadow-2 transition-all active:scale-[0.99]'
    : '';

  return (
    <div
      className={`rounded-lg border border-line bg-surface overflow-hidden text-left ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
