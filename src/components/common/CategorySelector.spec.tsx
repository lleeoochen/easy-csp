/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { CategorySelector } from './CategorySelector';
import { useRegularCategoryNameMap } from '@/hooks/api/useCSP';

vi.mock('../../hooks/api/useCSP');
vi.mock('./select', () => ({
  Select: ({ options, value, onValueChange, placeholder }: any) => (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      data-testid="category-select"
    >
      <option value="">{placeholder}</option>
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
}));

describe('CategorySelector', () => {
  const mockOnValueChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    const mockMap = new Map([
      ['groceries', 'Groceries'],
      ['diningOut', 'Dining Out'],
      ['transportation', 'Transportation'],
    ]);
    vi.mocked(useRegularCategoryNameMap).mockReturnValue(mockMap);
  });

  it('should render category selector', () => {
    render(
      <CategorySelector value="" onValueChange={mockOnValueChange} />
    );
    expect(screen.getByTestId('category-select')).toBeInTheDocument();
  });

  it('should render with label', () => {
    render(
      <CategorySelector
        value=""
        onValueChange={mockOnValueChange}
        label="Category"
      />
    );
    expect(screen.getByText('Category')).toBeInTheDocument();
  });

  it('should include "All categories" option by default', () => {
    render(
      <CategorySelector value="" onValueChange={mockOnValueChange} />
    );
    expect(screen.getByText('All categories')).toBeInTheDocument();
  });

  it('should not include "All categories" when includeAllOption is false', () => {
    render(
      <CategorySelector
        value=""
        onValueChange={mockOnValueChange}
        includeAllOption={false}
      />
    );
    expect(screen.queryByText('All categories')).not.toBeInTheDocument();
  });

  it('should render category options from map', () => {
    render(
      <CategorySelector value="" onValueChange={mockOnValueChange} />
    );
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Dining Out')).toBeInTheDocument();
    expect(screen.getByText('Transportation')).toBeInTheDocument();
  });

  it('should call onValueChange when selection changes', async () => {
    const { user } = render(
      <CategorySelector value="" onValueChange={mockOnValueChange} />
    );
    const select = screen.getByTestId('category-select');

    await user.selectOptions(select, 'groceries');
    expect(mockOnValueChange).toHaveBeenCalledWith('groceries');
  });

  it('should display selected value', () => {
    render(
      <CategorySelector value="groceries" onValueChange={mockOnValueChange} />
    );
    const select = screen.getByTestId('category-select') as HTMLSelectElement;
    expect(select.value).toBe('groceries');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <CategorySelector
        value=""
        onValueChange={mockOnValueChange}
        className="custom-class"
      />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should use custom placeholder', () => {
    render(
      <CategorySelector
        value=""
        onValueChange={mockOnValueChange}
        placeholder="Choose category"
      />
    );
    expect(screen.getByText('Choose category')).toBeInTheDocument();
  });
});
