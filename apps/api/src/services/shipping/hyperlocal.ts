// Hyperlocal delivery provider integration (stub)
import { logger } from '../../utils/logger';

// In-memory pincode-to-provider mapping (could be DB-backed in production)
const hyperlocalPincodeMap: Record<string, string[]> = {
  '110001': ['QuickGo', 'CityFleet'],
  '560001': ['QuickGo'],
  '400001': ['CityFleet'],
  // ...add more as needed
};

export function isHyperlocalEligible(originPincode: string, destPincode: string): boolean {
  // For now, eligible if both pincodes are in the same city and mapped to a provider
  return (
    hyperlocalPincodeMap[originPincode]?.length > 0 &&
    hyperlocalPincodeMap[destPincode]?.length > 0 &&
    originPincode === destPincode // simple: only intra-pincode for stub
  );
}

export function getHyperlocalProviders(pincode: string): string[] {
  return hyperlocalPincodeMap[pincode] || [];
}

// Stub: schedule a hyperlocal delivery
export async function scheduleHyperlocalDelivery({
  origin,
  destination,
  parcel,
  provider,
  orderId,
}: {
  origin: { pincode: string; address: string };
  destination: { pincode: string; address: string };
  parcel: { weight: number };
  provider: string;
  orderId: string;
}): Promise<{ success: boolean; trackingId: string; etaMinutes: number; provider: string }> {
  logger.info(
    `[Hyperlocal] Scheduling delivery with ${provider} for order ${orderId} (parcel: ${JSON.stringify(parcel)}) from ${origin.pincode} to ${destination.pincode} (${destination.address})`,
  );
  // Simulate API call to provider
  return {
    success: true,
    trackingId: `HL-${provider}-${Date.now()}`,
    etaMinutes: 45,
    provider,
  };
}
