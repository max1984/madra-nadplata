import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Chart,
  LineElement, BarElement, PointElement,
  LineController, BarController,
  CategoryScale, LinearScale,
  Filler, Legend, Tooltip,
} from 'chart.js';
import './index.css';
import SalaryApp from './SalaryApp.tsx';
import { loadExternalScripts } from './lib/scripts';

Chart.register(
  LineElement, BarElement, PointElement,
  LineController, BarController,
  CategoryScale, LinearScale,
  Filler, Legend, Tooltip,
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SalaryApp />
  </StrictMode>,
);

loadExternalScripts();
