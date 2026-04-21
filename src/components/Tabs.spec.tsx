import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Tabs, TabMenuItem } from './Tabs';
import { Home, Settings, User } from 'lucide-react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../hooks/useHideOnScroll', () => ({
  useHideOnScroll: vi.fn(() => true),
}));

describe('TabMenuItem', () => {
  it('should render tab with name', () => {
    render(
      <MemoryRouter>
        <TabMenuItem path="/home" name="Home" icon={Home} />
      </MemoryRouter>
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('should render icon', () => {
    const { container } = render(
      <MemoryRouter>
        <TabMenuItem path="/home" name="Home" icon={Home} />
      </MemoryRouter>
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should have link to path', () => {
    render(
      <MemoryRouter>
        <TabMenuItem path="/settings" name="Settings" icon={Settings} />
      </MemoryRouter>
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/settings');
  });

  it('should apply active styles when on current path', () => {
    render(
      <MemoryRouter initialEntries={['/home']}>
        <TabMenuItem path="/home" name="Home" icon={Home} />
      </MemoryRouter>
    );
    const link = screen.getByRole('link');
    expect(link).toHaveClass('bg-tabs-bar-active-bg', 'text-tabs-bar-active-fg');
  });

  it('should not apply active styles when not on current path', () => {
    render(
      <MemoryRouter initialEntries={['/other']}>
        <TabMenuItem path="/home" name="Home" icon={Home} />
      </MemoryRouter>
    );
    const link = screen.getByRole('link');
    expect(link).not.toHaveClass('bg-tabs-bar-active-bg');
  });
});

describe('Tabs', () => {
  const mockPaths = [
    {
      path: '/home',
      name: 'Home',
      element: <div>Home Content</div>,
      icon: Home,
      showInNav: true,
    },
    {
      path: '/settings',
      name: 'Settings',
      element: <div>Settings Content</div>,
      icon: Settings,
      showInNav: true,
    },
    {
      path: '/hidden',
      name: 'Hidden',
      element: <div>Hidden Content</div>,
      icon: User,
      showInNav: false,
    },
  ];

  it('should render navigation items', () => {
    render(<Tabs paths={mockPaths} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should not render hidden navigation items', () => {
    render(<Tabs paths={mockPaths} />);
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });

  it('should render navigation bar', () => {
    const { container } = render(<Tabs paths={mockPaths} />);
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });

  it('should have grid layout for navigation', () => {
    const { container } = render(<Tabs paths={mockPaths} />);
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('grid', 'grid-cols-5');
  });

  it('should have fixed positioning for navigation', () => {
    const { container } = render(<Tabs paths={mockPaths} />);
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('fixed', 'bottom-5');
  });

  it('should render main content area', () => {
    const { container } = render(<Tabs paths={mockPaths} />);
    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('flex-1');
  });
});
