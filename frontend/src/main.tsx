import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { appBasePath } from './config/app';
import { queryClient } from './app/queryClient';
import { AppRoutes } from './routes/AppRoutes';
import './styles/global.css';
import { AuthProvider } from './features/auth/AuthProvider';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={appBasePath || '/'}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
