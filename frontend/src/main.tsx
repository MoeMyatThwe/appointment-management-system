import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { useEffect } from 'react'
import { queryClient } from './app/queryClient'
import { router } from './app/router'
import { useAuthStore } from './features/auth/authStore'
import { ToastProvider } from './shared/components/ToastProvider'
import './index.css'

function AppBootstrap() {
  const hydrate = useAuthStore((state) => state.hydrate)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  return <ToastProvider><RouterProvider router={router} /></ToastProvider>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppBootstrap />
    </QueryClientProvider>
  </StrictMode>,
)
