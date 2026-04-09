import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { Switch } from './switch';

describe('Switch', () => {
  it('should render switch element', () => {
    render(<Switch />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('should be unchecked by default', () => {
    render(<Switch />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('should be checked when checked prop is true', () => {
    render(<Switch checked={true} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('should call onCheckedChange when clicked', async () => {
    const handleChange = vi.fn();
    const { user } = render(<Switch onCheckedChange={handleChange} />);

    await user.click(screen.getByRole('switch'));
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('should toggle from checked to unchecked', async () => {
    const handleChange = vi.fn();
    const { user } = render(<Switch checked={true} onCheckedChange={handleChange} />);

    await user.click(screen.getByRole('switch'));
    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it('should not call onCheckedChange when disabled', async () => {
    const handleChange = vi.fn();
    const { user } = render(<Switch disabled onCheckedChange={handleChange} />);

    await user.click(screen.getByRole('switch'));
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Switch disabled />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });

  it('should apply custom className', () => {
    render(<Switch className="custom-switch" />);
    expect(screen.getByRole('switch')).toHaveClass('custom-switch');
  });

  it('should forward ref', () => {
    const ref = vi.fn();
    render(<Switch ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it('should have correct button type', () => {
    render(<Switch />);
    expect(screen.getByRole('switch')).toHaveAttribute('type', 'button');
  });

  it('should apply checked styles', () => {
    render(<Switch checked={true} />);
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveClass('bg-secondary-bg');
  });

  it('should apply unchecked styles', () => {
    render(<Switch checked={false} />);
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveClass('bg-secondary-bg');
  });

  it('should have base styles', () => {
    render(<Switch />);
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveClass(
      'inline-flex',
      'h-6',
      'w-11',
      'shrink-0',
      'cursor-pointer',
      'items-center',
      'rounded-full'
    );
  });
});
