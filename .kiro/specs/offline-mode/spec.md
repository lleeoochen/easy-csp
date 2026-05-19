# Offline Mode

## Goal

When the user loses internet connectivity, show cached data instead of errors or blank screens.

---

## Implementation Status: ✅ Complete (pending phone testing)

---

## What Was Built

### 1. `useOnlineStatus` hook (`src/hooks/useOnlineStatus.ts`)
- Uses `useSyncExternalStore` with `navigator.onLine` + `online`/`offline` events
- Reactively tracks connectivity state

### 2. `OfflineBanner` component (`src/components/OfflineBanner.tsx`)
- Amber bar with WifiOff icon: "You're offline — showing cached data"
- Renders at top of app container when offline

### 3. React Query Cache Persistence (`main.tsx`)
- Replaced `QueryClientProvider` with `PersistQueryClientProvider`
- localStorage persister with 24h max age
- `gcTime` bumped from 10min to 24h for offline use
- All query data survives page refreshes

### 4. PWA Service Worker (`vite.config.ts`)
- `vite-plugin-pwa` v1.3.0 with `generateSW` mode
- Precaches all static assets (HTML, JS, CSS, images)
- App shell loads from cache even on cold start when offline
- Web app manifest with app name, icons, standalone display

### 5. Auth State Caching (`src/hooks/useAuthState.ts`)
- Caches `signedIn`, `userId`, `emailVerified`, `mfaEnrolled` in localStorage
- Initializes from cache immediately (no loading flash)
- 24h expiry on cached auth
- Only clears cache on confirmed logout (when online)

### 6. Offline Auth Bypass (`src/App.tsx`)
- Skips email verification and MFA enrollment checks when `navigator.onLine === false`
- Trusts cached auth state for read-only offline access

---

## Files Modified

| File | Change |
|------|--------|
| `main.tsx` | PersistQueryClientProvider, localStorage persister, 24h gcTime |
| `src/App.tsx` | OfflineBanner, skip MFA/email checks when offline |
| `src/hooks/useOnlineStatus.ts` | New — connectivity detection |
| `src/hooks/useAuthState.ts` | Rewritten — caches auth state in localStorage |
| `src/components/OfflineBanner.tsx` | New — offline indicator |
| `vite.config.ts` | Added vite-plugin-pwa, base path trailing slash |
| `public/pwa-192x192.svg` | New — PWA icon |
| `public/pwa-512x512.svg` | New — PWA icon |
| `package.json` | Added @tanstack/react-query-persist-client, vite-plugin-pwa |

---

## How It Works

1. User loads app online → data cached in localStorage, auth state cached, SW caches app shell
2. User goes offline (airplane mode, no wifi) → `navigator.onLine` becomes `false`
3. User opens/reloads app → SW serves cached HTML/JS/CSS, React Query serves cached data, auth bypasses MFA check
4. Offline banner appears at top
5. Mutations (edits/deletes) will fail with error — app is read-only when offline

---

## Testing

### Desktop (DevTools limitation)
- Chrome DevTools Network "Offline" checkbox does NOT reliably set `navigator.onLine = false` on reload
- Use **Application → Service Workers → Offline** checkbox instead (also unreliable on reload)
- Best tested on real device

### Phone (recommended)
1. Deploy to GitHub Pages: `npm run deploy`
2. Open on phone, add to home screen
3. Navigate around (caches data)
4. Turn on airplane mode
5. Reopen app — should show cached data with offline banner

---

## Known Limitations

- **Read-only when offline** — mutations will fail
- **First visit must be online** — no data to cache on first use
- **24h cache expiry** — after 24h offline, auth cache expires and user must reconnect
- **SVG icons** — placeholder icons, should be replaced with proper PNG app icons
- **No mutation queue** — offline writes are not queued for later sync (future enhancement)

---

## Security Considerations

- Financial data in localStorage is same risk as Firebase's own IndexedDB cache (already happening)
- Protected by device lock screen + browser same-origin policy
- Auth bypass only skips MFA *re-verification*, not initial authentication
- Cache cleared on explicit logout when online

---

## Future Enhancements

- Offline mutation queue (queue writes, sync when back online)
- Proper PNG app icons (replace SVG placeholders)
- Cache size management (evict old data if localStorage fills up)
- "Last synced X minutes ago" indicator
