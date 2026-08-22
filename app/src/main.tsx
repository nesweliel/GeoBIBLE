import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'
import { UnifiedRuntime } from './UnifiedRuntime'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UnifiedRuntime />
  </React.StrictMode>,
)
