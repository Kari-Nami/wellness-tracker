import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './app/queryClient';
import { AppRoutes } from './routes/AppRoutes';
import './styles/global.css';
import { UnsavedProvider } from './app/UnsavedProvider';
import { UnloadProtection } from './app/UnloadProtection';
import { ErrorBoundary } from './app/ErrorBoundary';
import { AuthProvider } from './features/auth/AuthProvider';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <UnsavedProvider>
          <UnloadProtection />
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </UnsavedProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
);
