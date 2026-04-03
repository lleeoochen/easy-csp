import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './src/App'
import './src/styles/auth.css'
import { ThemeProvider } from './src/contexts/ThemeContext'

// Create a client for React Query
const queryClient = new QueryClient();

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
