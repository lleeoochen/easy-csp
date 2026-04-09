# Testing Guide for Easy CSP Frontend

## Quick Start

```bash
# Install dependencies (if not already done)
npm install

# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm test -- --watch

# Run tests with UI (interactive browser interface)
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Test Structure

```
src/
├── components/
│   ├── Button.tsx
│   └── Button.spec.tsx          # Component tests
├── hooks/
│   ├── useAuthState.ts
│   └── useAuthState.spec.ts     # Hook tests
├── utils/
│   ├── financialUtils.ts
│   └── financialUtils.spec.ts   # Utility tests
└── test/
    ├── setup.ts                  # Global test setup
    └── testUtils.tsx             # Custom render utilities
```

## Writing Your First Test

### 1. Utility Function Test

```typescript
// src/utils/myUtil.spec.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from './myUtil';

describe('myFunction', () => {
  it('should return expected value', () => {
    expect(myFunction(5)).toBe(10);
  });
});
```

### 2. React Hook Test

```typescript
// src/hooks/useCounter.spec.ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('should increment counter', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });
});
```

### 3. Component Test

```typescript
// src/components/Button.spec.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { Button } from './Button';

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
});
```

## Common Testing Patterns

### Testing Async Operations

```typescript
import { waitFor } from '@testing-library/react';

await waitFor(() => {
  expect(result.current.data).toBeDefined();
});
```

### Testing React Query Hooks

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

const { result } = renderHook(() => useMyQuery(), { wrapper });
```

### Mocking Functions

```typescript
import { vi } from 'vitest';

const mockFn = vi.fn();
mockFn.mockReturnValue('mocked value');
mockFn.mockResolvedValue('async value');
```

### Mocking Modules

```typescript
vi.mock('./myModule', () => ({
  myFunction: vi.fn(() => 'mocked'),
}));
```

## Test Coverage

View coverage report after running:

```bash
npm run test:coverage
```

Open `coverage/index.html` in your browser for detailed report.

## Tips

1. **Test behavior, not implementation** — Focus on what users see and do
2. **Use semantic queries** — Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Keep tests simple** — One concept per test
4. **Mock external dependencies** — Firebase, API calls, etc.
5. **Test edge cases** — Empty states, errors, loading states

## Troubleshooting

### Tests fail with "Cannot find module"

Make sure you've installed dependencies:
```bash
npm install
```

### Firebase errors in tests

Firebase is mocked by default in `src/test/setup.ts`. If you need custom behavior, add mocks in your test file.

### Tests timeout

Increase timeout for slow operations:
```typescript
it('slow test', async () => {
  // test code
}, 10000); // 10 second timeout
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
