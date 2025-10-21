import axios from 'axios';
import {
  ShippingAdapter,
  RateQuoteRequest,
  RateQuoteResponse,
  CreateLabelRequest,
  CreateLabelResponse,
  TrackShipmentRequest,
  TrackShipmentResponse,
} from './types';

export type DelhiveryConfig = {
  apiKey: string;
  baseUrl?: string;
};

/**
 * Delhivery API adapter
 * Docs: https://developers.delhivery.com
 */
export class DelhiveryAdapter implements ShippingAdapter {
  name = 'Delhivery';
  private config: DelhiveryConfig;

  constructor(config?: DelhiveryConfig) {
    this.config = config || {
      apiKey: process.env.DELHIVERY_API_KEY || '',
      baseUrl: process.env.DELHIVERY_BASE_URL || 'https://track.delhivery.com/api',
    };
  }

  async rateQuote(request: RateQuoteRequest): Promise<RateQuoteResponse[]> {
    const resp = await axios.get(`${this.config.baseUrl}/kinko/v1/invoice/charges`, {
      headers: { Authorization: `Token ${this.config.apiKey}` },
      params: {
        md: request.paymentMode === 'cod' ? 'E' : 'S', // E=Express COD, S=Surface prepaid
        ss: 'Delivered',
        d_pin: request.destination.pincode,
        o_pin: request.origin.pincode,
        cgm: request.parcel.weight * 1000, // grams
      },
    });

    const data = resp.data[0] || {};
    return [{
      courier: 'Delhivery',
      serviceType: request.paymentMode === 'cod' ? 'COD' : 'Prepaid',
      rate: parseFloat(data.total_amount || 0),
      estimatedDays: parseInt(data.expected_delivery_date || 3, 10),
      currency: 'INR',
    }];
  }

  async createLabel(request: CreateLabelRequest): Promise<CreateLabelResponse> {
    const waybill = await this.fetchWaybill();
    
    const pickupData = {
      shipments: [{
        name: request.destination.name,
        add: request.destination.addressLine1,
        pin: request.destination.pincode,
        city: request.destination.city,
        state: request.destination.state,
        country: request.destination.country,
        phone: request.destination.phone,
        order: request.orderId,
        payment_mode: request.paymentMode === 'cod' ? 'COD' : 'Prepaid',
        return_pin: request.origin.pincode,
        return_city: request.origin.city,
        return_phone: request.origin.phone,
        return_add: request.origin.addressLine1,
        return_state: request.origin.state,
        return_country: request.origin.country,
        products_desc: 'Order Items',
        hsn_code: '',
        cod_amount: request.codAmount || 0,
        order_date: new Date().toISOString(),
        total_amount: request.codAmount || 0,
        seller_add: request.origin.addressLine1,
        seller_name: request.origin.name,
        seller_inv: '',
        quantity: 1,
        waybill,
        shipment_width: request.parcel.breadth || 10,
        shipment_height: request.parcel.height || 10,
        weight: request.parcel.weight,
        seller_gst_tin: '',
        shipping_mode: 'Surface',
        address_type: 'home',
      }],
      pickup_location: {
        name: request.origin.name,
        add: request.origin.addressLine1,
        city: request.origin.city,
        pin_code: request.origin.pincode,
        country: request.origin.country,
        phone: request.origin.phone,
      },
    };

    await axios.post(`${this.config.baseUrl}/cmu/create.json`, `format=json&data=${JSON.stringify(pickupData)}`, {
      headers: {
        Authorization: `Token ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      awbCode: waybill,
      courierName: 'Delhivery',
      pickupScheduled: true,
    };
  }

  async trackShipment(request: TrackShipmentRequest): Promise<TrackShipmentResponse> {
    const resp = await axios.get(`${this.config.baseUrl}/v1/packages/json/`, {
      headers: { Authorization: `Token ${this.config.apiKey}` },
      params: { waybill: request.awbCode },
    });

    const shipment = resp.data.ShipmentData?.[0]?.Shipment || {};
    const scans = shipment.Scans || [];

    return {
      awbCode: request.awbCode,
      status: this.mapStatus(shipment.Status?.Status),
      currentLocation: scans[0]?.ScannedLocation,
      activities: scans.map((s: any) => ({
        timestamp: new Date(s.ScanDateTime),
        location: s.ScannedLocation,
        status: s.ScanType,
        remarks: s.Instructions,
      })),
    };
  }

  private async fetchWaybill(): Promise<string> {
    const resp = await axios.get(`${this.config.baseUrl}/waybill/api/bulk/json/`, {
      headers: { Authorization: `Token ${this.config.apiKey}` },
      params: { count: 1 },
    });
    return resp.data[0] || `DHL${Date.now()}`;
  }

  private mapStatus(status?: string): TrackShipmentResponse['status'] {
    const s = (status || '').toLowerCase();
    if (s.includes('delivered')) return 'delivered';
    if (s.includes('out for delivery')) return 'out_for_delivery';
    if (s.includes('in transit') || s.includes('dispatched')) return 'in_transit';
    if (s.includes('return')) return 'returned';
    if (s.includes('cancel')) return 'failed';
    return 'pending';
  }
}
