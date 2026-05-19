# Offline Mode — Show Cached Data When Offline

## Goal

When the user loses internet connectivity, the app should gracefully show whatever data is already cached rather than showing errors or blank screens.

---

## Current State (Findings)

### React Query Setup (`main.tsx`)

- **@tanstack/react-query v5.90** is the data fetching layer
- QueryClient configured with:
  - `staleTime: 5 minutes` — data stays fresh
  - `gcTime: 10 minutes` — unused data kept in memory
  - `refetchOnWindowFocus: false`
  - `refetchOnReconnect: false`
  - `retry: 1` with 1s delay

### Data Fetching Hooks (`src/hooks/api/`)

All server state uses React Query hooks:
- `useCSP` — Conscious Spending Plan
- `useTransactions` / `useTransaction` — Transactions (infinite query)
- `useAccounts` — Accounts
- `useFunds` — Funds
- `useRules` — Rules
- `useFinancialInstitutions` — Linked institutions
- `useNetWorthHistory` — Net worth history
- `useSplitTransactions` — Split transactions

Each hook calls a service function (e.g., `ConsciousSpendingPlanService.getCSP()`) that reads from Firestore.

### Cache Utilities (`src/hooks/api/cacheUtils.ts`)

Helper functions for optimistic cache updates: `updateItemInCache`, `addItemToCache`, `removeItemFromCache`, `reorderItemsInCache`.

### What's Missing

1. **No offline detection** — app doesn't know when user is offline
2. **No cache persistence** — React Query cache is in-memory only; lost on page refresh
3. **No offline UI** — no banner/indicator telling user they're viewing cached data
4. **Mutations while offline** — no strategy for queuing writes

---

## Proposed Approach

### 1. `useOnlineStatus` Hook

A simple hook using `navigator.onLine` + `online`/`offline` events to expose connectivity state.

### 2. Offline Banner Component

A small banner (e.g., top of screen) that appears when offline: "You're offline — showing cached data."

### 3. React Query Persist (Cache Persistence)

Use `@tanstack/react-query-persist-client` with a localStorage or IndexedDB persister so cached data survives page refreshes. This means:
- User loads app online → data cached
- User goes offline or refreshes → app shows persisted cache

### 4. Query Behavior When Offline

React Query already handles this well with current config:
- `refetchOnReconnect: false` means it won't error-spam when reconnecting
- Queries with cached data will continue to show stale data (no network request needed if cache exists)
- New queries that have never been fetched will show loading/error — acceptable

### 5. Mutation Handling (Future)

For now, mutations while offline will simply fail with an error toast. A future enhancement could queue mutations using `onlineMutationManager` from React Query.

---

## Implementation Plan

| Step | What | Files |
|------|------|-------|
| 1 | Create `useOnlineStatus` hook | `src/hooks/useOnlineStatus.ts` |
| 2 | Create `OfflineBanner` component | `src/components/OfflineBanner.tsx` |
| 3 | Install & configure `@tanstack/react-query-persist-client` | `main.tsx`, `package.json` |
| 4 | Add `OfflineBanner` to app layout | `src/App.tsx` or `src/components/Page.tsx` |
| 5 | Adjust query `networkMode` if needed | `main.tsx` default options |

---

## Key Decisions

- **Persistence storage**: IndexedDB (via `createSyncStoragePersister` or `createAsyncStoragePersister`) — better for larger datasets than localStorage's 5MB limit
- **Cache max age**: Match `gcTime` (10 min) or extend for offline (e.g., 24 hours for persisted cache)
- **Scope**: Read-only offline experience first; offline writes are a separate future feature
- **No service worker needed** for this phase — React Query persistence handles data; the app shell is already served from Vite's build output
