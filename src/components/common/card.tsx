import React from 'react';

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className = '', children }: CardProps) {
  const baseClasses = 'bg-card rounded-lg shadow-sm border border-gray-200';
  const combinedClasses = `${baseClasses} ${className}`.trim();

  return (
    <div className={combinedClasses}>
      {children}
    </div>
  );
}
