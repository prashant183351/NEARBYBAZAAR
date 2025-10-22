export interface BuyerSegment {
  id: string;
  name: string;
  criteria: {
    category?: string;
    location?: string;
    ageRange?: [number, number];
    purchaseFrequency?: 'low' | 'medium' | 'high';
  };
}

export interface TargetedAdRequest {
  buyerId: string;
  buyerProfile: {
    age: number;
    location: string;
    category: string;
    purchaseFrequency: 'low' | 'medium' | 'high';
  };
}

export interface TargetedAdResponse {
  buyerId: string;
  matchedSegments: BuyerSegment[];
  ads: Array<{
    segmentId: string;
    adContent: string;
  }>;
}
