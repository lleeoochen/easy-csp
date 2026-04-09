import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { Page } from './Page';
import { useQueryClient } from '@tanstack/react-query';

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: vi.fn(),
  };
});

vi.mock('./PullToRefresh', () => ({
  PullToRefresh: ({ children, className }: any) => (
    <div data-testid="pull-to-refresh" className={className}>
      {children}
    </div>
  ),
}));

describe('Page', () => {
  const mockResetQueries = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useQueryClient).mockReturnValue({
      resetQueries: mockResetQueries,
    } as any);
  });

  it('should render children', () => {
    render(
      <Page>
        <div>Test Content</div>
      </Page>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render title when provided', () => {
    render(<Page title="My Page">Content</Page>);
    expect(screen.getByText('My Page')).toBeInTheDocument();
  });

  it('should not render title when not provided', () => {
    const { container } = render(<Page>Content</Page>);
    const h1 = container.querySelector('h1');
    expect(h1?.textContent).toBe('');
  });

  it('should apply mobile width class by default', () => {
    render(<Page>Content</Page>);
    const pullToRefresh = screen.getByTestId('pull-to-refresh');
    expect(pullToRefresh).toHaveClass('w-full', 'md:w-96');
  });

  it('should apply half width class', () => {
    render(<Page maxWidth="half">Content</Page>);
    const pullToRefresh = screen.getByTestId('pull-to-refresh');
    expect(pullToRefresh).toHaveClass('w-full', 'md:w-96', 'lg:w-1/2');
  });

  it('should apply full width class', () => {
    render(<Page maxWidth="full">Content</Page>);
    const pullToRefresh = screen.getByTestId('pull-to-refresh');
    expect(pullToRefresh).toHaveClass('w-full');
  });

  it('should apply half-xl width class', () => {
    render(<Page maxWidth="half-xl">Content</Page>);
    const pullToRefresh = screen.getByTestId('pull-to-refresh');
    expect(pullToRefresh).toHaveClass('w-full', 'md:w-96', 'lg:w-full', 'xl:w-1/2');
  });

  it('should have container and padding classes', () => {
    render(<Page>Content</Page>);
    const pullToRefresh = screen.getByTestId('pull-to-refresh');
    expect(pullToRefresh).toHaveClass('container', 'p-4', 'pb-24', 'm-auto');
  });

  it('should render with PullToRefresh wrapper', () => {
    render(<Page>Content</Page>);
    expect(screen.getByTestId('pull-to-refresh')).toBeInTheDocument();
  });
});
