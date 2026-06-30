import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

/* ─── Fontsource: Self-hosted Google Fonts ─── */
import '@fontsource/plus-jakarta-sans/400.css'
import '@fontsource/plus-jakarta-sans/600.css'
import '@fontsource/plus-jakarta-sans/700.css'
import '@fontsource/hanken-grotesk/600.css'

import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
