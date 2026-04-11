import React from 'react';
import { Input } from '../common/input';

interface FormFieldProps {
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  type,
  value,
  onChange,
  placeholder,
  required = false,
  autoComplete,
  autoFocus = false,
  maxLength,
}) => (
  <div>
    <label className="block text-sm font-medium mb-2">{label}</label>
    <Input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      maxLength={maxLength}
    />
  </div>
);
