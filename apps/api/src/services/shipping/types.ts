export type Address = {
  name: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

export type Parcel = {
  weight: number; // kg
  length?: number; // cm
  breadth?: number;
  height?: number;
  declaredValue?: number; // for insurance
};

export type RateQuoteRequest = {
  origin: Pick<Address, 'pincode' | 'country'>;
  destination: Pick<Address, 'pincode' | 'country'>;
  parcel: Parcel;
  paymentMode?: 'prepaid' | 'cod';
};

export type RateQuoteResponse = {
  courier: string;
  serviceType: string;
  rate: number; // in INR
  estimatedDays?: number;
  currency: string;
};

export type CreateLabelRequest = {
  orderId: string;
  origin: Address;
  destination: Address;
  parcel: Parcel;
  paymentMode: 'prepaid' | 'cod';
  codAmount?: number;
};

export type CreateLabelResponse = {
  awbCode: string; // tracking number
  courierName: string;
  labelUrl?: string;
  pickupScheduled?: boolean;
  estimatedDelivery?: string;
};

export type TrackShipmentRequest = {
  awbCode: string;
};

export type TrackShipmentResponse = {
  awbCode: string;
  status: 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned';
  currentLocation?: string;
  estimatedDelivery?: string;
  activities: Array<{
    timestamp: Date;
    location?: string;
    status: string;
    remarks?: string;
  }>;
};

/**
 * Shipping adapter interface
 */
export interface ShippingAdapter {
  name: string;

  /**
   * Get rate quotes for shipping
   */
  rateQuote(request: RateQuoteRequest): Promise<RateQuoteResponse[]>;

  /**
   * Create shipping label and book courier
   */
  createLabel(request: CreateLabelRequest): Promise<CreateLabelResponse>;

  /**
   * Track shipment status
   */
  trackShipment(request: TrackShipmentRequest): Promise<TrackShipmentResponse>;
}
