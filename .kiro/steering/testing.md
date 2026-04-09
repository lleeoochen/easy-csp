---
inclusion: auto
---

# Testing Guide for Easy CSP

## Overview

Easy CSP uses different testing frameworks for frontend and backend:

- **Frontend (easy-csp)**: Vitest + React Testing Library
- **Backend (easy-csp-cloud/functions)**: Jest + Firebase Functions Test

---

## Frontend Testing (easy-csp)

### Test Framework: Vitest

Vitest is a fast, Vite-native test runner with Jest-compatible API.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Test File Naming

- Unit tests: `*.spec.ts` or `*.spec.tsx`
- Integration tests: `*.test.ts` or `*.test.tsx`
- Place tests next to the files they test

### Writing Tests

#### Utility Function Tests

```typescript
import { describe, it, expect } from 'vitest';
import { formatCurrency } from './financialUtils';

describe('formatCurrency', () => {
  it('should format positive numbers correctly', () => {
    expect(formatCurrency(1234.56, 2, true)).toBe('$1,234.56');
  });

  it('should handle null values', () => {
    expect(formatCurrency(null as any, 2, true)).toBe('$0.00');
  });
});
```

#### React Hook Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuthState } from './useAuthState';

describe('useAuthState', () => {
  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useAuthState());
    expect(result.current.loading).toBe(true);
  });
});
```

#### Component Tests

```typescript
import { describe, it, expect } from 'vitest';
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

#### React Query Hook Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTransactions } from './useTransactions';

describe('useTransactions', () => {
  it('should fetch transactions', async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useTransactions('user-123'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
```

### Mocking

#### Mock Firebase

Firebase is automatically mocked in `src/test/setup.ts`. For custom behavior:

```typescript
import { vi } from 'vitest';
import { getDoc } from 'firebase/firestore';

vi.mocked(getDoc).mockResolvedValue({
  exists: () => true,
  data: () => ({ name: 'Test' }),
} as any);
```

#### Mock API Calls

```typescript
import { vi } from 'vitest';
import * as transactionsService from '@/services/transactionsService';

vi.spyOn(transactionsService, 'getTransactions').mockResolvedValue([
  { id: '1', name: 'Test Transaction', amount: 100 }
]);
```

### Test Utilities

Use `src/test/testUtils.tsx` for rendering with providers:

```typescript
import { render } from '@/test/testUtils';

// Automatically wraps with Redux, React Query, and Router
const { store, queryClient } = render(<MyComponent />);
```

---

## Backend Testing (easy-csp-cloud/functions)

### Test Framework: Jest

Jest is the standard testing framework for Node.js applications.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test File Naming

- Place tests in `__tests__` folders or name them `*.test.ts`
- Example: `src/services/__tests__/RulesService.test.ts`

### Writing Tests

#### Service Tests

```typescript
import { RulesService } from '../RulesService';
import { Transaction, RuleCondition } from '@easy-csp/shared-types';

describe('RulesService', () => {
  describe('evaluateRuleCriteria', () => {
    it('should match exact name criteria', () => {
      const transaction: Transaction = {
        id: 'txn-1',
        name: 'Starbucks',
        // ... other fields
      };

      const criteria = {
        name: {
          condition: RuleCondition.Exact,
          value: 'Starbucks',
        },
      };

      expect(RulesService.evaluateRuleCriteria(transaction, criteria)).toBe(true);
    });
  });
});
```

#### Cloud Function Tests

```typescript
import * as admin from 'firebase-admin';
import * as functionsTest from 'firebase-functions-test';
import { myFunction } from '../index';

const test = functionsTest();

describe('myFunction', () => {
  afterAll(() => {
    test.cleanup();
  });

  it('should process request correctly', async () => {
    const wrapped = test.wrap(myFunction);
    const result = await wrapped({ data: 'test' });

    expect(result).toEqual({ success: true });
  });
});
```

#### Firestore Integration Tests

For tests that need real Firestore (use emulator):

```typescript
import * as admin from 'firebase-admin';
import { clearFirestore } from '../test/helpers';

describe('Firestore Integration', () => {
  beforeEach(async () => {
    await clearFirestore();
  });

  it('should create document', async () => {
    const firestore = admin.firestore();
    const docRef = await firestore.collection('test').add({ name: 'Test' });

    const doc = await docRef.get();
    expect(doc.data()?.name).toBe('Test');
  });
});
```

### Mocking

#### Mock Firestore

```typescript
const mockGet = jest.fn();
const mockDoc = jest.fn(() => ({ get: mockGet }));
const mockCollection = jest.fn(() => ({ doc: mockDoc }));

jest.spyOn(admin, 'firestore').mockReturnValue({
  collection: mockCollection,
} as any);
```

#### Mock External APIs (Plaid)

```typescript
import { PlaidClient } from '../clients/PlaidClient';

jest.spyOn(PlaidClient, 'getTransactions').mockResolvedValue({
  transactions: [],
  accounts: [],
});
```

---

## Test Coverage Goals

### Frontend
- **Utilities**: 90%+ coverage
- **Hooks**: 80%+ coverage
- **Components**: 70%+ coverage (focus on logic, not UI)
- **Services**: 85%+ coverage

### Backend
- **Services**: 90%+ coverage
- **Activities**: 85%+ coverage
- **Utilities**: 95%+ coverage
- **Cloud Functions**: 80%+ coverage

---

## Best Practices

### General

1. **Test behavior, not implementation** — Focus on what the code does, not how
2. **Keep tests simple** — One assertion per test when possible
3. **Use descriptive test names** — "should do X when Y happens"
4. **Arrange-Act-Assert** — Structure tests clearly
5. **Avoid test interdependence** — Each test should run independently

### Frontend Specific

1. **Use semantic queries** — Prefer `getByRole`, `getByLabelText` over `getByTestId`
2. **Test user interactions** — Use `@testing-library/user-event` for realistic interactions
3. **Mock external dependencies** — Firebase, API calls, etc.
4. **Test loading and error states** — Not just happy paths
5. **Avoid testing implementation details** — Don't test internal state

### Backend Specific

1. **Use Firebase emulator for integration tests** — Don't hit production
2. **Mock external APIs** — Plaid, Secret Manager, etc.
3. **Test error handling** — Ensure functions handle failures gracefully
4. **Test authentication** — Verify functions check user permissions
5. **Clean up after tests** — Clear Firestore, reset mocks

---

## Common Patterns

### Testing Async Operations

```typescript
// Frontend
await waitFor(() => {
  expect(result.current.data).toBeDefined();
});

// Backend
await expect(asyncFunction()).resolves.toBe(expectedValue);
```

### Testing Error Handling

```typescript
// Frontend
const { result } = renderHook(() => useMyHook());
await waitFor(() => {
  expect(result.current.isError).toBe(true);
  expect(result.current.error?.message).toBe('Expected error');
});

// Backend
await expect(myFunction()).rejects.toThrow('Expected error');
```

### Testing with Timers

```typescript
import { vi } from 'vitest';

vi.useFakeTimers();

// Advance time
vi.advanceTimersByTime(1000);

// Run all timers
vi.runAllTimers();

// Restore real timers
vi.useRealTimers();
```

---

## Continuous Integration

Tests run automatically on:
- Pre-commit (via git hooks, if configured)
- Pull requests
- Before deployment

Ensure all tests pass before merging code.

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Jest Documentation](https://jestjs.io/)
- [Firebase Functions Test](https://firebase.google.com/docs/functions/unit-testing)
