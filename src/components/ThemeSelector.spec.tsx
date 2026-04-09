import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { ThemeSelector } from './ThemeSelector';
import { useTheme } from '../hooks/useTheme';

vi.mock('../hooks/useTheme');

describe('ThemeSelector', () => {
  const mockSetTheme = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTheme).mockReturnValue({
      theme: 'ocean',
      setTheme: mockSetTheme,
    } as any);
  });

  it('should render theme selector card', () => {
    render(<ThemeSelector />);
    expect(screen.getByText('Theme')).toBeInTheDocument();
  });

  it('should render palette icon', () => {
    const { container } = render(<ThemeSelector />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should render theme buttons', () => {
    render(<ThemeSelector />);
    const buttons = screen.getAllByRole('button');
    // Should have multiple theme buttons
    expect(buttons.length).toBeGreaterThan(1);
  });

  it('should call setTheme when theme button is clicked', async () => {
    const { user } = render(<ThemeSelector />);
    const buttons = screen.getAllByRole('button');

    await user.click(buttons[0]);
    expect(mockSetTheme).toHaveBeenCalled();
  });

  it('should highlight active theme', () => {
    render(<ThemeSelector />);
    const oceanThemeButton = screen.getByLabelText('ocean theme');
    expect(oceanThemeButton).toHaveClass('ring-4', 'ring-offset-2', 'ring-gray-400', 'scale-110');
  });

  it('should not highlight inactive themes', () => {
    render(<ThemeSelector />);
    const buttons = screen.getAllByRole('button');
    const inactiveButtons = buttons.filter(
      (btn) => !btn.classList.contains('scale-110')
    );
    expect(inactiveButtons.length).toBeGreaterThan(0);
  });

  it('should have aria-labels for accessibility', () => {
    render(<ThemeSelector />);
    expect(screen.getAllByLabelText(/theme$/)).toHaveLength(4);
  });

  it('should have hover effects on inactive themes', () => {
    render(<ThemeSelector />);
    const buttons = screen.getAllByRole('button');
    const inactiveButton = buttons.find(
      (btn) => !btn.classList.contains('scale-110')
    );
    expect(inactiveButton).toHaveClass('hover:scale-105');
  });
});
