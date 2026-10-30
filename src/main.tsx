import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { recoverFromStaleChunk } from './libs/chunkRecovery.ts';
import { initClientTelemetry } from './libs/telemetry.ts';

// Inisialisasi Real User Monitoring (RUM) & Core Web Vitals Tracking
initClientTelemetry();

window.addEventListener('vite:preloadError', (event) => {
  const preloadEvent = event as Event & { payload?: unknown };
  if (recoverFromStaleChunk(preloadEvent.payload)) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
