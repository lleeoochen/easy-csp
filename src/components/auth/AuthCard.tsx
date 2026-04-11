import React from 'react';

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  maxWidth?: 'sm' | 'md';
}

export const AuthCard: React.FC<AuthCardProps> = ({
  children,
  title,
  maxWidth = 'md'
}) => {
  const widthClass = maxWidth === 'sm' ? 'max-w-sm' : 'max-w-md';

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 overflow-hidden">
      <div className={`${widthClass} w-full bg-white/30 backdrop-blur-xl rounded-2xl shadow-2xl p-6 relative z-10 border border-white/20`}>
        <h2 className="text-2xl font-bold mb-6 text-center">{title}</h2>
        {children}
      </div>
    </div>
  );
};
