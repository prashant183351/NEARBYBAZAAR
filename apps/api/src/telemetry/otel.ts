// OpenTelemetry initialization for NearbyBazaar API
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    headers: {},
  }),
  instrumentations: [getNodeAutoInstrumentations()],
  // Remove unsupported samplingRate property
});

export function startOtel() {
  sdk.start();

  console.log('OpenTelemetry started');
}
