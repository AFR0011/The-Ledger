import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { registerTheLedgerServiceWorker } from './pwa';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

registerTheLedgerServiceWorker();
