import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './lib/emergencySystem';
import './lib/adminSync';
import './lib/adminGameBridge';
import './lib/entryFeeEngine';
import { bindGameFeeButtons } from './lib/gameFeeDeduction';

// Bind game mode buttons when page loads
bindGameFeeButtons();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
