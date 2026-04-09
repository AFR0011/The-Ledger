import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { installVitePreloadRecovery } from './pwa';
import './styles/globals.css';

installVitePreloadRecovery();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
