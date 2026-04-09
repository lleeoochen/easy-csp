import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { BackButton } from './BackButton';
import { useNavigate } from 'react-router-dom';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

describe('BackButton', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });

  it('should render with default label', () => {
    render(<BackButton />);
    expect(screen.getByText('Back')).toBeInTheDocument();
  });

  it('should render with custom label', () => {
    render(<BackButton label="Go Back" />);
    expect(screen.getByText('Go Back')).toBeInTheDocument();
  });

  it('should render arrow icon', () => {
    const { container } = render(<BackButton />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should navigate back when clicked without "to" prop', async () => {
    const { user } = render(<BackButton />);

    await user.click(screen.getByText('Back'));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('should navigate to specific path when "to" prop is provided', async () => {
    const { user } = render(<BackButton to="/home" />);

    await user.click(screen.getByText('Back'));
    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  it('should have secondary variant styling', () => {
    render(<BackButton />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-secondary-bg', 'text-secondary-fg');
  });

  it('should have flex layout with gap', () => {
    render(<BackButton />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('flex', 'items-center', 'gap-2');
  });
});
