import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { Input } from './input';

describe('Input', () => {
  it('should render input element', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('should handle text input', async () => {
    const { user } = render(<Input placeholder="Type here" />);
    const input = screen.getByPlaceholderText('Type here');

    await user.type(input, 'Hello World');
    expect(input).toHaveValue('Hello World');
  });

  it('should call onChange when value changes', async () => {
    const handleChange = vi.fn();
    const { user } = render(<Input onChange={handleChange} placeholder="Input" />);

    await user.type(screen.getByPlaceholderText('Input'), 'a');
    expect(handleChange).toHaveBeenCalled();
  });

  it('should support different input types', () => {
    const { rerender } = render(<Input type="text" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'text');

    rerender(<Input type="email" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'email');

    rerender(<Input type="password" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'password');

    rerender(<Input type="number" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'number');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled placeholder="Disabled" />);
    expect(screen.getByPlaceholderText('Disabled')).toBeDisabled();
  });

  it('should apply custom className', () => {
    render(<Input className="custom-input" placeholder="Custom" />);
    expect(screen.getByPlaceholderText('Custom')).toHaveClass('custom-input');
  });

  it('should forward ref', () => {
    const ref = vi.fn();
    render(<Input ref={ref} placeholder="Ref input" />);
    expect(ref).toHaveBeenCalled();
  });

  it('should support placeholder', () => {
    render(<Input placeholder="Enter your name" />);
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
  });

  it('should support value prop', () => {
    render(<Input value="Initial value" onChange={() => {}} />);
    expect(screen.getByDisplayValue('Initial value')).toBeInTheDocument();
  });

  it('should support defaultValue', () => {
    render(<Input defaultValue="Default text" />);
    expect(screen.getByDisplayValue('Default text')).toBeInTheDocument();
  });

  it('should apply base styles', () => {
    render(<Input placeholder="Styled" />);
    const input = screen.getByPlaceholderText('Styled');
    expect(input).toHaveClass('flex', 'h-10', 'w-full', 'px-2', 'py-1', 'bg-gray-100', 'rounded-lg');
  });

  it('should support required attribute', () => {
    render(<Input required placeholder="Required" />);
    expect(screen.getByPlaceholderText('Required')).toBeRequired();
  });

  it('should support maxLength attribute', () => {
    render(<Input maxLength={10} placeholder="Max length" />);
    expect(screen.getByPlaceholderText('Max length')).toHaveAttribute('maxLength', '10');
  });
});
