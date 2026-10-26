import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker with auto-update policy
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[L7a4eg PWA] New version detected, updating cache automatically.');
  },
  onOfflineReady() {
    console.log('[L7a4eg PWA] Application cached and ready for offline use.');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
