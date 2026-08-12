import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthBootstrap } from '@/features/auth/AuthBootstrap';
import { ToastViewport } from '@/shared/components/ui/ToastViewport';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthBootstrap>
          {children}
          <ToastViewport />
        </AuthBootstrap>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
