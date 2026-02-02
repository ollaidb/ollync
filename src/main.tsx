import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './i18n'
import './index.css'

const updateThemeColor = () => {
  const sample = document.createElement('div')
  sample.style.backgroundColor = 'var(--background)'
  sample.style.position = 'absolute'
  sample.style.left = '-9999px'
  document.body.appendChild(sample)
  const resolved = getComputedStyle(sample).backgroundColor
  sample.remove()

  let meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', resolved)
}

// Initialiser le thème au démarrage de l'application
const savedTheme = localStorage.getItem('theme') || 'light'
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const shouldUseDark = savedTheme === 'dark' || (savedTheme === 'system' && prefersDark)

if (shouldUseDark) {
  document.documentElement.classList.add('dark')
} else {
  document.documentElement.classList.remove('dark')
}

updateThemeColor()

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

