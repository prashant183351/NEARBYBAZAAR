import { logger } from '../utils/logger';
import axios from 'axios';

// Send log to SIEM (e.g., ELK, external service)
export async function sendToSiem(event: any) {
	logger.info({ siem: true, ...event });
	if (process.env.SIEM_ENDPOINT) {
		try {
			await axios.post(process.env.SIEM_ENDPOINT, event);
		} catch (err) {
			logger.error({ siem: true, error: err });
		}
	}
}

// Simple anomaly detection
export function detectAnomaly(logs: any[], pattern: string, threshold: number) {
	const count = logs.filter(l => l.message?.includes(pattern)).length;
	return count >= threshold;
}

// Alerting (email/Slack/WhatsApp)
export async function sendAlert(message: string) {
	logger.warn({ alert: true, message });
	if (process.env.ALERT_EMAIL) {
		await axios.post(process.env.ALERT_EMAIL, { message });
	}
	if (process.env.ALERT_SLACK) {
		await axios.post(process.env.ALERT_SLACK, { text: message });
	}
	if (process.env.ALERT_WHATSAPP) {
		await axios.post(process.env.ALERT_WHATSAPP, { text: message });
	}
}
