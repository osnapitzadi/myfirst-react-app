import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import initIdleCursor from './lib/idleCursor.js'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)

// Hide the cursor after 10s idle (kiosk display).
initIdleCursor()
