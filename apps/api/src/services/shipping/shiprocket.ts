// Stub for reverse logistics pickup scheduling
export async function schedulePickup({ address, contact, orderId, returnId }: any) {
  // Simulate scheduling a pickup with Shiprocket API
  // In real implementation, call Shiprocket's pickup API here
  return {
    tracking: 'SR123456789',
    pickupId: 'PICKUP123',
    scheduledAt: new Date(),
    address,
    contact,
    orderId,
    returnId,
  };
}
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

export type ShiprocketConfig = {
  email: string;
  password: string;
  baseUrl?: string;
};

/**
 * Shiprocket API adapter
 * Docs: https://apidocs.shiprocket.in
 */
export class ShiprocketAdapter implements ShippingAdapter {
  name = 'Shiprocket';
  private config: ShiprocketConfig;
  private token?: string;
  private tokenExpiry?: Date;

  constructor(config?: ShiprocketConfig) {
    this.config = config || {
      email: process.env.SHIPROCKET_EMAIL || '',
      password: process.env.SHIPROCKET_PASSWORD || '',
      baseUrl: process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external',
    };
  }

  private async getToken(): Promise<string> {
    if (this.token && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.token;
    }

    const resp = await axios.post(`${this.config.baseUrl}/auth/login`, {
      email: this.config.email,
      password: this.config.password,
    });

    this.token = resp.data.token;
    this.tokenExpiry = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000); // ~9 days
    return this.token || '';
  }

  async rateQuote(request: RateQuoteRequest): Promise<RateQuoteResponse[]> {
    const token = await this.getToken();
    const resp = await axios.get(`${this.config.baseUrl}/courier/serviceability`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        pickup_postcode: request.origin.pincode,
        delivery_postcode: request.destination.pincode,
        weight: request.parcel.weight,
        cod: request.paymentMode === 'cod' ? 1 : 0,
      },
    });

    const couriers = resp.data?.data?.available_courier_companies || [];
    return couriers.map((c: any) => ({
      courier: c.courier_name || c.name || 'Unknown',
      serviceType: c.courier_type || 'surface',
      rate: parseFloat(c.rate || 0),
      estimatedDays: parseInt(c.etd || 0, 10),
      currency: 'INR',
    }));
  }

  async createLabel(request: CreateLabelRequest): Promise<CreateLabelResponse> {
    const token = await this.getToken();

    // Create order first
    const orderResp = await axios.post(
      `${this.config.baseUrl}/orders/create/adhoc`,
      {
        order_id: request.orderId,
        order_date: new Date().toISOString().split('T')[0],
        pickup_location: 'Primary',
        billing_customer_name: request.destination.name,
        billing_phone: request.destination.phone,
        billing_address: request.destination.addressLine1,
        billing_city: request.destination.city,
        billing_state: request.destination.state,
        billing_pincode: request.destination.pincode,
        billing_country: request.destination.country,
        billing_email: request.destination.email || '',
        shipping_is_billing: true,
        order_items: [
          {
            name: 'Order Item',
            sku: 'DEFAULT',
            units: 1,
            selling_price: request.codAmount || 0,
          },
        ],
        payment_method: request.paymentMode === 'cod' ? 'COD' : 'Prepaid',
        sub_total: request.codAmount || 0,
        length: request.parcel.length || 10,
        breadth: request.parcel.breadth || 10,
        height: request.parcel.height || 10,
        weight: request.parcel.weight,
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );

    const shipmentId = orderResp.data.shipment_id;

    // Generate AWB
    const awbResp = await axios.post(
      `${this.config.baseUrl}/courier/assign/awb`,
      { shipment_id: shipmentId },
      { headers: { Authorization: `Bearer ${token}` } },
    );

    return {
      awbCode: awbResp.data.response?.data?.awb_code || '',
      courierName: awbResp.data.response?.data?.courier_name || 'Shiprocket',
      labelUrl: awbResp.data.response?.data?.label_url,
      pickupScheduled: false,
    };
  }

  async trackShipment(request: TrackShipmentRequest): Promise<TrackShipmentResponse> {
    const token = await this.getToken();
    const resp = await axios.get(`${this.config.baseUrl}/courier/track/awb/${request.awbCode}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const tracking = resp.data.tracking_data || {};
    const scans = tracking.shipment_track || [];

    return {
      awbCode: request.awbCode,
      status: this.mapStatus(tracking.track_status || scans[0]?.current_status),
      currentLocation: scans[0]?.location,
      estimatedDelivery: tracking.edd,
      activities: scans.map((s: any) => ({
        timestamp: new Date(s.date),
        location: s.location,
        status: s.current_status,
        remarks: s.activity,
      })),
    };
  }

  private mapStatus(status?: string | number): TrackShipmentResponse['status'] {
    const s = String(status || '').toLowerCase();
    if (s.includes('delivered') || s === '7') return 'delivered';
    if (s.includes('out for delivery') || s === '6') return 'out_for_delivery';
    if (s.includes('in transit') || s.includes('picked') || s === '4' || s === '5')
      return 'in_transit';
    if (s.includes('return')) return 'returned';
    if (s.includes('fail') || s.includes('cancel')) return 'failed';
    return 'pending';
  }
}
