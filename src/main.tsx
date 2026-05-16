// Source: RESEARCH.md §"Scaffold: src/main.tsx"
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { HarnessPage } from './ui/HarnessPage.js';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');
createRoot(root).render(
  <StrictMode>
    <HarnessPage />
  </StrictMode>,
);
