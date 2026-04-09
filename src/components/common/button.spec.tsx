import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { Button } from './button';

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    const { user } = render(<Button onClick={handleClick}>Click</Button>);

    await user.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('should apply primary variant styles', () => {
    render(<Button variant="primary">Primary</Button>);
    const button = screen.getByText('Primary');
    expect(button).toHaveClass('bg-primary-bg', 'text-primary-fg');
  });

  it('should apply secondary variant styles', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByText('Secondary');
    expect(button).toHaveClass('bg-secondary-bg', 'text-secondary-fg');
  });

  it('should apply icon variant styles', () => {
    render(<Button variant="icon">Icon</Button>);
    const button = screen.getByText('Icon');
    expect(button).toHaveClass('bg-secondary-bg', 'text-secondary-fg', 'px-3', 'py-1');
  });

  it('should apply disabled styles when disabled', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByText('Disabled');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('bg-gray-400', 'text-gray-600');
  });

  it('should not call onClick when disabled', async () => {
    const handleClick = vi.fn();
    const { user } = render(<Button disabled onClick={handleClick}>Disabled</Button>);

    await user.click(screen.getByText('Disabled'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByText('Custom')).toHaveClass('custom-class');
  });

  it('should forward ref', () => {
    const ref = vi.fn();
    render(<Button ref={ref}>Ref Button</Button>);
    expect(ref).toHaveBeenCalled();
  });

  it('should support type attribute', () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByText('Submit')).toHaveAttribute('type', 'submit');
  });

  it('should apply base styles', () => {
    render(<Button>Base</Button>);
    const button = screen.getByText('Base');
    expect(button).toHaveClass('rounded-lg', 'px-4', 'py-2', 'shadow-md', 'cursor-pointer');
  });
});
