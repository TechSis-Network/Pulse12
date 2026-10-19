import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import '@/index.css'

const appId = import.meta.env.VITE_BASE44_APP_ID?.trim();
const appBaseUrl = import.meta.env.VITE_BASE44_APP_BASE_URL?.trim();
let validBackendUrl = false;
try {
  const url = new URL(appBaseUrl || '');
  validBackendUrl = ['http:', 'https:'].includes(url.protocol) && url.origin !== window.location.origin;
} catch {
  // Show setup instructions before initializing the SDK.
}

const App = lazy(() => import('@/App'));

ReactDOM.createRoot(document.getElementById('root')!).render(
  appId && validBackendUrl ? (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    }><App /></Suspense>
  ) : (
    <main className="mx-auto max-w-xl p-8 space-y-4">
      {/* <h1 className="text-2xl font-semibold">Connect Pulse12 to Base44</h1>
      <p>Set VITE_BASE44_APP_ID and VITE_BASE44_APP_BASE_URL in .env.local, then restart the dev server.</p>
      <p>Use your published Base44 app URL for the backend URL. See .env.example and README.md for setup and Vercel instructions.</p> */}
      <h1 className="text-2xl font-semibold">Failed to Connect</h1>
    </main>
  )
)
