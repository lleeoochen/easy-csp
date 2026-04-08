import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './src/App'
import './src/styles/auth.css'
import { ThemeProvider } from './src/contexts/ThemeContext'

// Create a client for React Query with optimized settings for Firestore
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh longer
      gcTime: 1000 * 60 * 10, // 10 minutes - keep unused data in cache
      refetchOnWindowFocus: false, // Don't refetch when switching tabs
      refetchOnReconnect: false, // Don't refetch on network reconnect
      retry: 1, // Only retry once instead of 3 times
      retryDelay: 1000, // Wait 1 second before retry
    },
  },
});

// This code is only for TypeScript
// declare global {
//   interface Window {
//     __TANSTACK_QUERY_CLIENT__:
//       import("@tanstack/query-core").QueryClient;
//   }
// }

// // This code is for all users
// window.__TANSTACK_QUERY_CLIENT__ = queryClient;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
