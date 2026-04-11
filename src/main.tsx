import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import {
  Chart,
  LineElement, BarElement, PointElement,
  LineController, BarController,
  CategoryScale, LinearScale,
  Filler, Legend, Tooltip,
} from 'chart.js';
import '@mantine/core/styles.css';
import './index.css';
import App from './App.tsx';
import { theme } from './theme.ts';

Chart.register(
  LineElement, BarElement, PointElement,
  LineController, BarController,
  CategoryScale, LinearScale,
  Filler, Legend, Tooltip,
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme} forceColorScheme="dark">
      <App />
    </MantineProvider>
  </StrictMode>,
);
