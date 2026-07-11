import {ClerkProvider} from '@clerk/react';
import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppProvider } from './store/appStore'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import App from './App'
import './index.css'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <ClerkProvider publishableKey="pk_test_Y3Jpc3QtZHJhZ29uLTMzLmNsZXJrLmFjY291bnRzLmRldiQ" afterSignOutUrl="/">
        <TooltipProvider>
          <App />
          <Toaster position="top-center" richColors />
        </TooltipProvider>
      </ClerkProvider>
    </AppProvider>
  </React.StrictMode>
)