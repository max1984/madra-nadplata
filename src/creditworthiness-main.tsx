import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import CreditworthinessApp from './CreditworthinessApp.tsx';
import { loadExternalScripts } from './lib/scripts';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CreditworthinessApp />
  </StrictMode>,
);

loadExternalScripts();
