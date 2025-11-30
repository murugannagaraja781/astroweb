import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/responsive.css'
import App from './App.jsx'
import './i18n';
import * as process from "process";

// Global Polyfills for WebRTC (simple-peer)
window.global = window;
window.process = process;
window.Buffer = [];

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
