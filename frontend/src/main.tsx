import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { Suspense, useEffect } from 'react'
import { queryClient } from './app/queryClient'
import { router } from './app/router'
import { useAuthStore } from './features/auth/authStore'
import { ToastProvider } from './shared/components/ToastProvider'
import './index.css'

function AppBootstrap() {
  const hydrate = useAuthStore((state) => state.hydrate)
  const isLoading = useAuthStore((state) => state.isLoading)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  if (isLoading) return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5"><div className="rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-slate-700" role="status" aria-live="polite">Loading workspace...</div></main>
  return <ToastProvider><Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-slate-950 px-5"><div className="rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-slate-700" role="status" aria-live="polite">Loading page...</div></main>}><RouterProvider router={router} /></Suspense></ToastProvider>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppBootstrap />
    </QueryClientProvider>
  </StrictMode>,
)
