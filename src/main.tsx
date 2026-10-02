import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { OrderRealtimeProvider } from '@/context/OrderRealtimeContext';
import App from './App';
import './index.css';
import { initNotificationSound, requestNotificationPermission } from '@/lib/notificationSound';

initNotificationSound();
requestNotificationPermission();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <OrderRealtimeProvider>
              <App />
            </OrderRealtimeProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
