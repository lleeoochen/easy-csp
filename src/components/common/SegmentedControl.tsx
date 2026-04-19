import { cn } from './utils';

export interface SegmentedControlOption<T> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  fullWidth?: boolean;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  fullWidth = false,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        'flex gap-1 p-1 bg-gray-100 rounded-lg',
        fullWidth ? 'w-full' : 'w-fit',
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'px-6 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer',
            fullWidth && 'flex-1',
            value === option.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
