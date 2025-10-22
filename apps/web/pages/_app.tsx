import type { AppProps } from 'next/app';
import { useEffect } from 'react';
// ...existing code...
import { CartProvider } from '../context/CartContext';
import { ToastProvider } from '@nearbybazaar/ui';

function logBuyerBehavior(event: string, data: Record<string, any>) {
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, data }),
  });
}

export default function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    window.addEventListener('beforeunload', () => {
      logBuyerBehavior('session_end', {});
    });

    logBuyerBehavior('session_start', {});

    return () => {
      window.removeEventListener('beforeunload', () => {
        logBuyerBehavior('session_end', {});
      });
    };
  }, []);

  return (
    <ToastProvider>
      <CartProvider>
        <Component {...pageProps} />
      </CartProvider>
    </ToastProvider>
  );
}
