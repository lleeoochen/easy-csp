import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import type { Persister } from '@tanstack/react-query-persist-client'
import App from './src/App'
import './src/styles/auth.css'
import { ThemeProvider } from './src/contexts/ThemeContext'

const CACHE_KEY = 'easy-csp-query-cache';

// Create a client for React Query with optimized settings for Firestore
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh longer
      gcTime: 1000 * 60 * 60 * 24, // 24 hours - keep cache for offline use
      refetchOnWindowFocus: false, // Don't refetch when switching tabs
      refetchOnReconnect: false, // Don't refetch on network reconnect
      retry: 1, // Only retry once instead of 3 times
      retryDelay: 1000, // Wait 1 second before retry
    },
  },
});

const persister: Persister = {
  persistClient: (client) => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(client));
  },
  restoreClient: () => {
    const data = localStorage.getItem(CACHE_KEY);
    return data ? JSON.parse(data) : undefined;
  },
  removeClient: () => {
    localStorage.removeItem(CACHE_KEY);
  },
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }}
    >
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </PersistQueryClientProvider>
  </StrictMode>,
)
