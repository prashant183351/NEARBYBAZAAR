export interface WholesalePriceTier {
  minQty: number;
  price: number;
}

export interface ABTestType {
  name: string;
  description?: string;
  feature: 'fomo' | 'urgency' | 'badge' | 'other';
  enabled: boolean;
  scope: 'global' | 'category' | 'product';
  category?: string;
  product?: string;
  variantA: {
    label: string;
    config: Record<string, any>;
    users: number;
    conversions: number;
  };
  variantB: {
    label: string;
    config: Record<string, any>;
    users: number;
    conversions: number;
  };
  startedAt: Date;
  endedAt?: Date;
}
export interface ProductType {
  wholesaleOnly?: boolean;
  minOrderQty?: number;
  wholesalePricing?: WholesalePriceTier[];
  // Core product fields (add more as needed)
  _id?: string;
  name: string;
  price: number;
  stock?: number;
  fomoEnabled?: boolean;
  fomoThreshold?: number;
  salePrice?: number;
  saleExpiresAt?: Date;
  // ...add other fields as needed
}
