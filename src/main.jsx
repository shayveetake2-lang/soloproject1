import React from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import '../style.css';
import '../hero-overrides.css';
import App from './LegacyApp.jsx';

const rootElement = document.getElementById('root');
if (rootElement && !rootElement.dataset.veloceBootstrapped) {
  rootElement.dataset.veloceBootstrapped = 'true';
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
