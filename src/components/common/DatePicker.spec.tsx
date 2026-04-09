import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { DatePicker } from './DatePicker';

describe('DatePicker', () => {
  const mockOnChange = vi.fn();
  const testDate = new Date('2024-01-15');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render date picker button', () => {
    render(<DatePicker value={testDate} onChange={mockOnChange} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should display formatted date', () => {
    render(<DatePicker value={testDate} onChange={mockOnChange} />);
    expect(screen.getByText(/January 14th, 2024/)).toBeInTheDocument();
  });

  it('should render with label', () => {
    render(
      <DatePicker
        value={testDate}
        onChange={mockOnChange}
        label="Select Date"
      />
    );
    expect(screen.getByText('Select Date')).toBeInTheDocument();
  });

  it('should render calendar icon', () => {
    const { container } = render(
      <DatePicker value={testDate} onChange={mockOnChange} />
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should open calendar when button is clicked', async () => {
    const { user } = render(
      <DatePicker value={testDate} onChange={mockOnChange} />
    );

    await user.click(screen.getByRole('button'));

    // DayPicker should be rendered
    const calendar = document.querySelector('.rdp-custom');
    expect(calendar).toBeInTheDocument();
  });

  it('should close calendar when clicking outside', async () => {
    const { user } = render(
      <DatePicker value={testDate} onChange={mockOnChange} />
    );

    // Open calendar
    await user.click(screen.getByRole('button'));
    expect(document.querySelector('.rdp-custom')).toBeInTheDocument();

    // Click backdrop
    const backdrop = document.querySelector('.fixed.inset-0');
    if (backdrop) {
      await user.click(backdrop);
    }

    // Calendar should be closed
    expect(document.querySelector('.rdp-custom')).not.toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <DatePicker value={testDate} onChange={mockOnChange} disabled={true} />
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should apply disabled styles', () => {
    render(
      <DatePicker value={testDate} onChange={mockOnChange} disabled={true} />
    );
    const button = screen.getByRole('button');
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('should not open calendar when disabled', async () => {
    const { user } = render(
      <DatePicker value={testDate} onChange={mockOnChange} disabled={true} />
    );

    await user.click(screen.getByRole('button'));

    expect(document.querySelector('.rdp-custom')).not.toBeInTheDocument();
  });

  it('should have correct button styling', () => {
    render(<DatePicker value={testDate} onChange={mockOnChange} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass(
      'flex',
      'h-10',
      'w-full',
      'items-center',
      'justify-between',
      'px-3',
      'py-2',
      'bg-gray-100',
      'rounded-lg'
    );
  });

  it('should support custom id', () => {
    render(
      <DatePicker
        value={testDate}
        onChange={mockOnChange}
        id="custom-date-picker"
      />
    );
    expect(screen.getByRole('button')).toHaveAttribute('id', 'custom-date-picker');
  });

  it('should have button type="button"', () => {
    render(<DatePicker value={testDate} onChange={mockOnChange} />);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });
});
