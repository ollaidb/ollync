import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialiser le thème au démarrage de l'application
const savedTheme = localStorage.getItem('theme') || 'light'
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const shouldUseDark = savedTheme === 'dark' || (savedTheme === 'system' && prefersDark)

if (shouldUseDark) {
  document.documentElement.classList.add('dark')
} else {
  document.documentElement.classList.remove('dark')
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service worker registration failed:', error)
    })
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

