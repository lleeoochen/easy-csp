import React from 'react';

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className = '', children }: CardProps) {
  const baseClasses = 'shadow-sm rounded-2xl h-fit md:flex md:flex-col';
  const combinedClasses = `${baseClasses} ${className}`.trim();

  return (
    <div className={combinedClasses}>
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children }: CardProps) {
  const baseClasses = 'bg-primary-bg text-primary-fg px-4 py-2 rounded-t-2xl';
  const combinedClasses = `${baseClasses} ${className}`.trim();

  return (
    <div className={combinedClasses}>
      {children}
    </div>
  );
}

export function CardContent({ className = '', children }: CardProps) {
  const baseClasses = 'bg-card px-4 py-2 rounded-b-2xl';
  const combinedClasses = `${baseClasses} ${className}`.trim();

  return (
    <div className={combinedClasses}>
      {children}
    </div>
  );
}