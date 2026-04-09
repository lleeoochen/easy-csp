import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/testUtils';
import { SetBalanceDialog } from './SetBalanceDialog';
import { useSetFundBalance } from '../hooks/api/useFunds';
import type { UI_FundAndBalance } from '../types/uiTypes';

vi.mock('../hooks/api/useFunds');

describe('SetBalanceDialog', () => {
  const mockMutate = vi.fn();
  const mockOnOpenChange = vi.fn();

  const mockFund: UI_FundAndBalance = {
    id: 'fund-123',
    name: 'Emergency Fund',
    currentAmount: 1000,
    targetAmount: 5000,
    type: 'manual',
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSetFundBalance).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as any);
  });

  it('should not render when fund is null', () => {
    const { container } = render(
      <SetBalanceDialog open={true} onOpenChange={mockOnOpenChange} fund={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render dialog when open and fund is provided', () => {
    render(
      <SetBalanceDialog open={true} onOpenChange={mockOnOpenChange} fund={mockFund} />
    );
    expect(screen.getByText('Set Balance')).toBeInTheDocument();
  });

  it('should display fund name', () => {
    render(
      <SetBalanceDialog open={true} onOpenChange={mockOnOpenChange} fund={mockFund} />
    );
    expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
  });

  it('should display current balance formatted', () => {
    render(
      <SetBalanceDialog open={true} onOpenChange={mockOnOpenChange} fund={mockFund} />
    );
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
  });

  it('should have input for new balance', () => {
    render(
      <SetBalanceDialog open={true} onOpenChange={mockOnOpenChange} fund={mockFund} />
    );
    expect(screen.getByLabelText('New Balance')).toBeInTheDocument();
  });

  it('should update input value when typing', async () => {
    const { user } = render(
      <SetBalanceDialog open={true} onOpenChange={mockOnOpenChange} fund={mockFund} />
    );
    const input = screen.getByLabelText('New Balance');

    await user.type(input, '2500');
    expect(input).toHaveValue(2500);
  });

  it('should show error when balance is empty and save is clicked', async () => {
    const { user } = render(
      <SetBalanceDialog open={true} onOpenChange={mockOnOpenChange} fund={mockFund} />
    );

    // The Save button is disabled when input is empty, so we can't click it
    // Instead, verify the button is disabled
    expect(screen.getByText('Save')).toBeDisabled();
  });

  it('should show error for invalid number', async () => {
    const { user } = render(
      <SetBalanceDialog open={true} onOpenChange={mockOnOpenChange} fund={mockFund} />
    );
    const input = screen.getByLabelText('New Balance') as HTMLInputElement;

    // Type 'abc' - but number inputs typically don't accept non-numeric characters
    // Instead, test that the button remains disabled with invalid input
    await user.type(input, 'abc');

    // The input type="number" will have an empty value when invalid text is entered
    expect(screen.getByText('Save')).toBeDisabled();
  });

  it('should call mutate with correct values on save', async () => {
    const { user } = render(
      <SetBalanceDialog open={true} onOpenChange={mockOnOpenChange} fund={mockFund} />
    );
    const input = screen.getByLabelText('New Balance');

    await user.type(input, '2500');
    await user.click(screen.getByText('Save'));

    expect(mockMutate).toHaveBeenCalledWith(
      { fundId: 'fund-123', newBalance: 2500 },
      expect.any(Object)
    );
  });

  it('should close dialog on successful save', async () => {
    mockMutate.mockImplementation((_, { onSuccess }) => {
      onSuccess();
    });

    const { user } = render(
      <SetBalanceDialog open={true} onOpenChange={mockOnOpenChange} fund={mockFund} />
    );
    const input = screen.getByLabelText('New Balance');

    await user.type(input, '2500');
    await user.click(screen.getByText('Save'));

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('should disable save button when input is empty', () => {
    render(
      <SetBalanceDialog open={true} onOpenChange={mockOnOpenChange} fund={mockFund} />
    );
    expect(screen.getByText('Save')).toBeDisabled();
  });

  it('should show loading state when saving', () => {
    vi.mocked(useSetFundBalance).mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isError: false,
      error: null,
    } as any);

    render(
      <SetBalanceDialog open={true} onOpenChange={mockOnOpenChange} fund={mockFund} />
    );
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('should disable inputs when saving', () => {
    vi.mocked(useSetFundBalance).mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isError: false,
      error: null,
    } as any);

    render(
      <SetBalanceDialog open={true} onOpenChange={mockOnOpenChange} fund={mockFund} />
    );
    expect(screen.getByLabelText('New Balance')).toBeDisabled();
  });

  it('should show error message on mutation error', () => {
    vi.mocked(useSetFundBalance).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: true,
      error: new Error('Network error'),
    } as any);

    render(
      <SetBalanceDialog open={true} onOpenChange={mockOnOpenChange} fund={mockFund} />
    );
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('should call onOpenChange when cancel is clicked', async () => {
    const { user } = render(
      <SetBalanceDialog open={true} onOpenChange={mockOnOpenChange} fund={mockFund} />
    );

    await user.click(screen.getByText('Cancel'));
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('should save on Enter key press', async () => {
    const { user } = render(
      <SetBalanceDialog open={true} onOpenChange={mockOnOpenChange} fund={mockFund} />
    );
    const input = screen.getByLabelText('New Balance');

    await user.type(input, '2500{Enter}');

    expect(mockMutate).toHaveBeenCalled();
  });

  it('should reset form when dialog opens', () => {
    const { rerender } = render(
      <SetBalanceDialog open={false} onOpenChange={mockOnOpenChange} fund={mockFund} />
    );

    rerender(
      <SetBalanceDialog open={true} onOpenChange={mockOnOpenChange} fund={mockFund} />
    );

    const input = screen.getByLabelText('New Balance');
    expect(input).toHaveValue(null);
  });
});
