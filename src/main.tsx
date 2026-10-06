import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ParticleAppearanceProvider } from './context/ParticleAppearance'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ParticleAppearanceProvider><App /></ParticleAppearanceProvider>
  </StrictMode>,
)
