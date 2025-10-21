import { ShippingAdapter } from './types';
import { ShiprocketAdapter } from './shiprocket';
import { DelhiveryAdapter } from './delhivery';

export type ShippingProvider = 'shiprocket' | 'delhivery';

const adapters: Record<ShippingProvider, ShippingAdapter> = {
  shiprocket: new ShiprocketAdapter(),
  delhivery: new DelhiveryAdapter(),
};

/**
 * Get shipping adapter by provider name
 * Defaults to env var SHIPPING_PROVIDER or 'shiprocket'
 */
export function getShippingAdapter(provider?: ShippingProvider): ShippingAdapter {
  const p = provider || (process.env.SHIPPING_PROVIDER as ShippingProvider) || 'shiprocket';
  const adapter = adapters[p];
  if (!adapter) {
    throw new Error(`Unsupported shipping provider: ${p}`);
  }
  return adapter;
}

/**
 * Register a custom adapter (for testing or plugins)
 */
export function registerShippingAdapter(provider: ShippingProvider, adapter: ShippingAdapter): void {
  adapters[provider] = adapter;
}

export * from './types';
export { ShiprocketAdapter } from './shiprocket';
export { DelhiveryAdapter } from './delhivery';
