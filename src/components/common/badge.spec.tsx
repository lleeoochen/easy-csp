import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { Badge } from './badge';

describe('Badge', () => {
  it('should render with text', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('should apply default variant styles', () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText('Default');
    expect(badge).toHaveClass('bg-primary-bg', 'text-primary-bg-foreground');
  });

  it('should apply secondary variant styles', () => {
    render(<Badge variant="secondary">Secondary</Badge>);
    const badge = screen.getByText('Secondary');
    expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground');
  });

  it('should apply destructive variant styles', () => {
    render(<Badge variant="destructive">Error</Badge>);
    const badge = screen.getByText('Error');
    expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground');
  });

  it('should apply outline variant styles', () => {
    render(<Badge variant="outline">Outline</Badge>);
    const badge = screen.getByText('Outline');
    expect(badge).toHaveClass('text-foreground', 'border', 'border-input', 'bg-background');
  });

  it('should apply custom className', () => {
    render(<Badge className="custom-badge">Custom</Badge>);
    expect(screen.getByText('Custom')).toHaveClass('custom-badge');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(<Badge ref={ref}>Ref Badge</Badge>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('should apply base styles', () => {
    render(<Badge>Base</Badge>);
    const badge = screen.getByText('Base');
    expect(badge).toHaveClass(
      'inline-flex',
      'items-center',
      'rounded-full',
      'border',
      'px-2.5',
      'py-0.5',
      'text-xs',
      'font-semibold'
    );
  });

  it('should support onClick', async () => {
    const handleClick = vi.fn();
    const { user } = render(<Badge onClick={handleClick}>Clickable</Badge>);

    await user.click(screen.getByText('Clickable'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('should render children correctly', () => {
    render(
      <Badge>
        <span>Icon</span> Text
      </Badge>
    );
    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText(/Text/)).toBeInTheDocument();
  });
});
