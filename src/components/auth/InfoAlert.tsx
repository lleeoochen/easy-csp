import React from 'react';

interface InfoAlertProps {
  message: string;
  variant?: 'info' | 'success';
}

export const InfoAlert: React.FC<InfoAlertProps> = ({ message, variant = 'info' }) => {
  const colorClass = variant === 'info' ? 'blue' : 'green';

  return (
    <div className={`mb-4 p-3 bg-${colorClass}-500/10 border border-${colorClass}-500/20 rounded-lg`}>
      <p className={`text-sm text-${colorClass}-500`}>{message}</p>
    </div>
  );
};
