// Core Web Vitals
import { reportWebVitals as reportWV } from '../lib/webVitals';
// Next.js custom export for web vitals
export function reportWebVitals(metric: any) {
	reportWV(metric);
}
