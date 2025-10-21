// Core Web Vitals reporting for Next.js
import type { Metric } from 'web-vitals';

export function reportWebVitals(metric: Metric) {
  // Send to analytics endpoint (API or 3rd party)
  fetch('/api/analytics/web-vitals', {
    method: 'POST',
    body: JSON.stringify(metric),
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
  });
}
