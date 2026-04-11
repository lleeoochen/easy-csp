import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/testUtils';
import LinkFinancialInstitutionButton from './LinkFinancialInstitutionButton';
import { httpsCallable } from 'firebase/functions';
import { usePlaidLink } from 'react-plaid-link';

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(),
  getFunctions: vi.fn(() => ({ _type: 'functions' })), // Return a mock functions object
}));
vi.mock('react-plaid-link');
vi.mock('../hooks/api/useFinancialInstitutions', () => ({
  useMarkInstitutionForResync: vi.fn(() => ({
    mutate: vi.fn(),
  })),
}));

describe('LinkFinancialInstitutionButton', () => {
  const mockOpen = vi.fn();
  const mockHttpsCallable = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(httpsCallable).mockReturnValue(mockHttpsCallable);
    vi.mocked(usePlaidLink).mockReturnValue({
      open: mockOpen,
      ready: true,
      error: null,
      exit: vi.fn(),
      submit: vi.fn(),
    });
  });

  it('should render with default button text', () => {
    render(<LinkFinancialInstitutionButton />);
    expect(screen.getByText('Add Account')).toBeInTheDocument();
  });

  it('should render with custom button text', () => {
    render(<LinkFinancialInstitutionButton buttonText="Link Bank" />);
    expect(screen.getByText('Link Bank')).toBeInTheDocument();
  });

  it('should show loading state when clicked', async () => {
    // Make the promise never resolve to keep loading state
    const pendingPromise = new Promise(() => {
      // Never resolves
    });
    mockHttpsCallable.mockReturnValue(pendingPromise);

    const { user } = render(<LinkFinancialInstitutionButton />);
    const button = screen.getByText('Add Account');

    await user.click(button);

    // Wait a bit for the state to update
    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('should call createLinkToken in add mode', async () => {
    mockHttpsCallable.mockResolvedValue({
      data: { link_token: 'test-token' },
    });

    const { user } = render(<LinkFinancialInstitutionButton />);

    await user.click(screen.getByText('Add Account'));

    await waitFor(() => {
      // Verify the function name is correct (second argument)
      const calls = vi.mocked(httpsCallable).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][1]).toBe('createLinkToken');
      expect(mockHttpsCallable).toHaveBeenCalled();
    });
  });

  it('should call createUpdateLinkToken in update mode', async () => {
    mockHttpsCallable.mockResolvedValue({
      data: { link_token: 'test-token' },
    });

    const { user } = render(
      <LinkFinancialInstitutionButton
        institutionDocId="doc-123"
        institutionId="inst-123"
        buttonText="Update Account"
      />
    );

    await user.click(screen.getByText('Update Account'));

    await waitFor(() => {
      // Verify the function name is correct (second argument)
      const calls = vi.mocked(httpsCallable).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][1]).toBe('createUpdateLinkToken');
      expect(mockHttpsCallable).toHaveBeenCalledWith({ institution_id: 'inst-123' });
    });
  });

  it('should apply custom className', () => {
    render(<LinkFinancialInstitutionButton className="custom-class" />);
    const button = screen.getByText('Add Account');
    expect(button).toHaveClass('custom-class');
  });

  it('should be disabled when loading', async () => {
    mockHttpsCallable.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { user } = render(<LinkFinancialInstitutionButton />);
    const button = screen.getByText('Add Account');

    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });

  it('should have primary variant styling', () => {
    render(<LinkFinancialInstitutionButton />);
    const button = screen.getByText('Add Account');
    expect(button).toHaveClass('bg-primary-bg', 'text-primary-fg');
  });
});
