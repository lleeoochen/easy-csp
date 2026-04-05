# Easy CSP Project Steering

## Project Overview

Easy CSP is a Conscious Spending Plan app. It has three packages:

- `easy-csp` — React frontend (Vite, TypeScript, Tailwind CSS)
- `easy-csp-cloud` — Firebase backend (Firestore, Cloud Functions, Node 20)
- `easy-csp-shared-types` — Shared TypeScript types consumed by both frontend and backend

The shared types package is packed as a `.tgz` and installed locally in both other packages via `npm run install:special`.

---

## Architecture

### Frontend (`easy-csp`)

- React 19 + TypeScript + Vite
- Tailwind CSS v4 for styling
- React Router v7 for routing
- Redux Toolkit for global state (existing code)
- **React Query (`@tanstack/react-query`) for all new data fetching** — prefer this over Redux for server state going forward
- Firebase SDK (client-side) for direct Firestore reads/writes
- Plaid Link (`react-plaid-link`) for the Plaid UI flow only — all Plaid API calls go through GCP Functions

### Backend (`easy-csp-cloud/functions`)

- Firebase Cloud Functions (Node 20, TypeScript)
- Firestore via `firebase-admin`
- Plaid Node SDK — all Plaid API interactions live here, never in the frontend
- Google Cloud Secret Manager for secrets

### Shared Types (`easy-csp-shared-types`)

- Pure TypeScript types/interfaces shared across frontend and backend
- No runtime logic — types only
- Covers Firestore document shapes, CSP categories, and Plaid categories

---

## API Boundaries

| Concern | Where it lives |
|---|---|
| Plaid token exchange, transactions sync, institution lookup | GCP Cloud Functions only |
| Firestore CRUD (non-Plaid) | Frontend directly via Firebase SDK |
| Auth | Firebase Auth (client-side) |
| Secrets (Plaid keys, etc.) | GCP Secret Manager, accessed only from Functions |

Never call Plaid APIs directly from the frontend. The frontend initiates the Plaid Link flow via `react-plaid-link`, then hands off tokens to a Cloud Function.

---

## Frontend Practices

### Data Fetching

- Use **React Query** for all new server state (Firestore reads, function calls)
- Wrap Firestore calls in query functions and expose them via `useQuery` / `useMutation`
- Avoid adding new Redux slices for server state — Redux is for local/UI state only
- Existing Redux code can stay as-is; migrate opportunistically

### UI Components

- Tailwind CSS v4 is the primary styling tool
- Custom UI components in `src/components/common/` for primitives (buttons, inputs, modals, etc.)
- Use `lucide-react` for icons (already installed)
- Use `clsx` + `tailwind-merge` for conditional class composition

### File Structure

```
src/
  components/   # Reusable UI components
  hooks/        # Custom React hooks (including React Query hooks)
  pages/        # Route-level page components
  services/     # Firestore service functions (called by React Query hooks)
  redux/        # Redux slices (UI/local state only)
  types/        # Frontend-only types (use shared-types for cross-package types)
  utils/        # Pure utility functions
```

---

## Backend Practices

### Cloud Functions

- One function per logical operation — keep functions focused
- All Plaid-related logic lives in `src/activities/` or `src/services/`
- Use `@google-cloud/secret-manager` to retrieve API keys at runtime
- Validate inputs before any Firestore or Plaid operation

### Firestore

- Document shapes are defined in `easy-csp-shared-types/src/firestore.types.ts`
- Always use typed converters when reading/writing documents
- Keep security rules in `easy-csp-cloud/firestore.rules`
- **Always prepare data before Firestore writes** — Firestore rejects `undefined` but accepts `null` and `deleteField()`

#### Create Operations (addDoc)
- **Use `withoutUndefinedValue`** for `addDoc` — filters out undefined fields
- `addDoc` does NOT support `deleteField()` — it's for creating new documents
  ```typescript
  import { withoutUndefinedValue } from "../utils/firestoreHelpers";

  // Create new document - undefined values are filtered out
  await addDoc(
    collection(firestore, "transactions"),
    withoutUndefinedValue({
      name: "Coffee",
      amount: 5.50,
      category: undefined  // This field will be omitted from the document
    })
  );
  ```

#### Update Operations (updateDoc)
- **Use `prepareFirestoreData`** for `updateDoc` — converts undefined to `deleteField()`
- This allows you to remove fields from existing documents by passing undefined
  ```typescript
  import { prepareFirestoreData } from "../utils/firestoreHelpers";

  // Update existing document - undefined values remove fields
  await updateDoc(docRef, prepareFirestoreData({
    name: "John",
    age: undefined,  // This field will be REMOVED from Firestore
    city: null       // This field will be set to null in Firestore
  }));
  ```

#### Full Document Replacement (setDoc)
- **Use `prepareFirestoreData`** for `setDoc` without merge — full document replacement
- **Use `prepareFirestoreData`** for `setDoc` with merge — behaves like updateDoc
  ```typescript
  import { prepareFirestoreData } from "../utils/firestoreHelpers";

  // Full replacement
  await setDoc(docRef, prepareFirestoreData(fullDocument));

  // Merge (like update)
  await setDoc(docRef, prepareFirestoreData(partialData), { merge: true });
  ```

#### Summary
- `addDoc` → use `withoutUndefinedValue` (filters undefined)
- `updateDoc` → use `prepareFirestoreData` (converts undefined to deleteField)
- `setDoc` → use `prepareFirestoreData` (works for both full replacement and merge)
- Legacy code may use `withoutUndefinedValue` everywhere — migrate to this pattern when touching that code

---

## Shared Types

- Add new shared types to `easy-csp-shared-types/src/`
- Export everything through `src/index.ts`
- After changes, rebuild and reinstall in both packages:
  ```
  npm run install:special   # run in easy-csp and easy-csp-cloud/functions
  ```

---

## Tooling

| Tool | Purpose |
|---|---|
| Vite | Frontend dev server and bundler |
| TypeScript ~5.9 | All packages |
| ESLint | Linting (frontend + functions) |
| Tailwind CSS v4 | Frontend styling |
| Firebase Emulator Suite | Local dev for Functions + Firestore |
| gh-pages | Frontend deployment |
| firebase deploy | Functions deployment |
