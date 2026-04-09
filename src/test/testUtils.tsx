import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Create a custom render function that includes providers
export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState = {},
    store = configureStore({
      reducer: {
        // Add your reducers here as needed
      },
      preloadedState,
    }),
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    }),
    ...renderOptions
  }: {
    preloadedState?: any;
    store?: any;
    queryClient?: QueryClient;
  } & Omit<RenderOptions, 'wrapper'> = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>{children}</BrowserRouter>
        </QueryClientProvider>
      </Provider>
    );
  }

  return {
    store,
    queryClient,
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  };
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { renderWithProviders as render };
