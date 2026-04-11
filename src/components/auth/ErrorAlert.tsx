import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message }) => (
  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
    <p className="text-sm text-red-500">{message}</p>
  </div>
);
