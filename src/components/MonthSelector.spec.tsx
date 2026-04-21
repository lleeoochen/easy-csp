import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { MonthSelector } from './MonthSelector';
import * as dateUtils from '@/utils/dateUtils';

// Mock date utilities
vi.mock('../utils/dateUtils', () => ({
  getMonthRange: vi.fn(),
  getCurrentMonthYear: vi.fn(),
}));

describe('MonthSelector', () => {
  const mockOnMonthSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock current date as January 2024
    vi.mocked(dateUtils.getCurrentMonthYear).mockReturnValue({
      month: 1,
      year: 2024,
    });

    // Mock month range
    vi.mocked(dateUtils.getMonthRange).mockReturnValue([
      { year: 2023, month: 12, displayName: 'Dec 2023', key: '2023-12' },
      { year: 2024, month: 1, displayName: 'Jan 2024', key: '2024-01' },
      { year: 2024, month: 2, displayName: 'Feb 2024', key: '2024-02' },
    ]);
  });

  it('should render month buttons', () => {
    render(
      <MonthSelector
        selectedMonth={1}
        selectedYear={2024}
        onMonthSelect={mockOnMonthSelect}
      />
    );

    expect(screen.getByText('Dec 2023')).toBeInTheDocument();
    expect(screen.getByText('Jan 2024')).toBeInTheDocument();
    expect(screen.getByText('Feb 2024')).toBeInTheDocument();
  });

  it('should call onMonthSelect when month button is clicked', async () => {
    const { user } = render(
      <MonthSelector
        selectedMonth={1}
        selectedYear={2024}
        onMonthSelect={mockOnMonthSelect}
      />
    );

    await user.click(screen.getByText('Feb 2024'));

    expect(mockOnMonthSelect).toHaveBeenCalledWith(2024, 2);
  });

  it('should highlight selected month', () => {
    render(
      <MonthSelector
        selectedMonth={2}
        selectedYear={2024}
        onMonthSelect={mockOnMonthSelect}
      />
    );

    const febButton = screen.getByText('Feb 2024');
    expect(febButton).toHaveClass('bg-primary-bg');
  });

  it('should show left arrow when future month is selected', () => {
    render(
      <MonthSelector
        selectedMonth={2}
        selectedYear={2024}
        onMonthSelect={mockOnMonthSelect}
      />
    );

    const leftArrow = screen.getByLabelText('Go to current month');
    expect(leftArrow).toBeInTheDocument();
  });

  it('should show right arrow when past month is selected', () => {
    render(
      <MonthSelector
        selectedMonth={12}
        selectedYear={2023}
        onMonthSelect={mockOnMonthSelect}
      />
    );

    const rightArrow = screen.getByLabelText('Go to current month');
    expect(rightArrow).toBeInTheDocument();
  });

  it('should not show arrows when current month is selected', () => {
    render(
      <MonthSelector
        selectedMonth={1}
        selectedYear={2024}
        onMonthSelect={mockOnMonthSelect}
      />
    );

    const arrows = screen.queryAllByLabelText('Go to current month');
    expect(arrows).toHaveLength(0);
  });

  it('should navigate to current month when arrow is clicked', async () => {
    const { user } = render(
      <MonthSelector
        selectedMonth={2}
        selectedYear={2024}
        onMonthSelect={mockOnMonthSelect}
      />
    );

    const arrow = screen.getByLabelText('Go to current month');
    await user.click(arrow);

    expect(mockOnMonthSelect).toHaveBeenCalledWith(2024, 1);
  });

  it('should apply custom className', () => {
    const { container } = render(
      <MonthSelector
        selectedMonth={1}
        selectedYear={2024}
        onMonthSelect={mockOnMonthSelect}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should mark current month with ring', () => {
    render(
      <MonthSelector
        selectedMonth={2}
        selectedYear={2024}
        onMonthSelect={mockOnMonthSelect}
      />
    );

    const janButton = screen.getByText('Jan 2024');
    expect(janButton).toHaveClass('ring-primary-bg');
  });

  it('should mark selected current month with white ring', () => {
    render(
      <MonthSelector
        selectedMonth={1}
        selectedYear={2024}
        onMonthSelect={mockOnMonthSelect}
      />
    );

    const janButton = screen.getByText('Jan 2024');
    expect(janButton).toHaveClass('ring-white');
  });
});
