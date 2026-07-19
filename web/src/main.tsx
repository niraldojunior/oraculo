import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

registerSW({
  immediate: true,
  // No-op proposital. Sem este callback o vite-plugin-pwa dispara
  // window.location.reload() assim que o worker novo ativa, recarregando a
  // página no meio do uso. A versão nova já fica ativa no cache e passa a
  // valer no próximo carregamento natural.
  onNeedReload() {},
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

