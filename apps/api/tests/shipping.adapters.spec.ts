import axios from 'axios';
import { ShiprocketAdapter } from '../src/services/shipping/shiprocket';
import { DelhiveryAdapter } from '../src/services/shipping/delhivery';
import { getShippingAdapter, registerShippingAdapter } from '../src/services/shipping';
import type {
  RateQuoteRequest,
  CreateLabelRequest,
  TrackShipmentRequest,
} from '../src/services/shipping/types';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Shiprocket Adapter', () => {
  let adapter: ShiprocketAdapter;

  beforeEach(() => {
    adapter = new ShiprocketAdapter({
      email: 'test@example.com',
      password: 'testpass',
      baseUrl: 'https://api.test.shiprocket.in',
    });
    jest.clearAllMocks();
  });

  it('should cache auth token', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { token: 'mock-token' } });
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          data: {
            available_courier_companies: [{ name: 'BlueDart', rate: 150, etd: '5' }],
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            available_courier_companies: [{ name: 'BlueDart', rate: 150, etd: '5' }],
          },
        },
      });

    const request: RateQuoteRequest = {
      origin: { pincode: '110001', country: 'India' },
      destination: { pincode: '560001', country: 'India' },
      parcel: { weight: 1, length: 10, breadth: 10, height: 10 },
      paymentMode: 'prepaid',
    };

    await adapter.rateQuote(request);
    await adapter.rateQuote(request);

    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  it('should fetch rate quotes', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { token: 'mock-token' } });
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        data: {
          available_courier_companies: [
            { name: 'BlueDart', rate: 150, etd: '5' },
            { name: 'Delhivery', rate: 120, etd: '6' },
          ],
        },
      },
    });

    const request: RateQuoteRequest = {
      origin: { pincode: '110001', country: 'India' },
      destination: { pincode: '560001', country: 'India' },
      parcel: { weight: 1, length: 10, breadth: 10, height: 10 },
      paymentMode: 'prepaid',
    };

    const quotes = await adapter.rateQuote(request);

    expect(quotes).toHaveLength(2);
    expect(quotes[0]).toMatchObject({
      courier: 'BlueDart',
      rate: 150,
      estimatedDays: 5,
      currency: 'INR',
    });
  });

  it('should create label with AWB', async () => {
    mockedAxios.post
      .mockResolvedValueOnce({ data: { token: 'mock-token' } })
      .mockResolvedValueOnce({ data: { order_id: 12345, shipment_id: 67890 } })
      .mockResolvedValueOnce({
        data: { response: { data: { awb_code: 'AWB123456', label_url: 'https://label.url' } } },
      });

    const request: CreateLabelRequest = {
      orderId: 'ORD-123',
      origin: {
        pincode: '110001',
        city: 'Delhi',
        state: 'Delhi',
        country: 'India',
        name: 'Seller',
        phone: '1234567890',
        addressLine1: 'Address',
      },
      destination: {
        pincode: '560001',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        name: 'Buyer',
        phone: '0987654321',
        addressLine1: 'Address',
      },
      parcel: { weight: 1, length: 10, breadth: 10, height: 10 },
      paymentMode: 'prepaid',
    };

    const label = await adapter.createLabel(request);

    expect(label.awbCode).toBe('AWB123456');
    expect(label.labelUrl).toBe('https://label.url');
    expect(label.courierName).toBe('Shiprocket');
    expect(mockedAxios.post).toHaveBeenCalledTimes(3); // auth + createOrder + assignAWB
  });

  it('should track shipment', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { token: 'mock-token' } });
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        tracking_data: {
          track_status: '7',
          shipment_status: 7,
          shipment_track: [
            {
              current_status: 'Delivered',
              date: '2024-01-05 10:30:00',
              location: 'Bangalore',
              activity: 'Package delivered',
            },
            {
              current_status: 'Out for Delivery',
              date: '2024-01-05 08:00:00',
              location: 'Bangalore Hub',
              activity: '',
            },
          ],
        },
      },
    });

    const request: TrackShipmentRequest = { awbCode: 'AWB123456' };
    const tracking = await adapter.trackShipment(request);

    expect(tracking.status).toBe('delivered');
    expect(tracking.activities).toHaveLength(2);
    expect(tracking.activities[0].location).toBe('Bangalore');
  });

  it('should map status correctly', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { token: 'mock-token' } });
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        tracking_data: {
          track_status: '6',
          shipment_status: 6,
          shipment_track: [
            {
              current_status: 'Out for Delivery',
              date: '2024-01-05 08:00:00',
              location: 'Hub',
              activity: '',
            },
          ],
        },
      },
    });

    const request: TrackShipmentRequest = { awbCode: 'AWB123456' };
    const tracking = await adapter.trackShipment(request);

    expect(tracking.status).toBe('out_for_delivery');
  });
});

describe('Delhivery Adapter', () => {
  let adapter: DelhiveryAdapter;

  beforeEach(() => {
    adapter = new DelhiveryAdapter({
      apiKey: 'test-api-key',
      baseUrl: 'https://api.test.delhivery.com',
    });
    jest.clearAllMocks();
  });

  it('should fetch rate quotes', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: [{ total_amount: '120.50', expected_delivery_date: '4' }],
    });

    const request: RateQuoteRequest = {
      origin: { pincode: '110001', country: 'India' },
      destination: { pincode: '560001', country: 'India' },
      parcel: { weight: 1, length: 10, breadth: 10, height: 10 },
      paymentMode: 'cod',
    };

    const quotes = await adapter.rateQuote(request);

    expect(quotes).toHaveLength(1);
    expect(quotes[0]).toMatchObject({
      courier: 'Delhivery',
      serviceType: 'COD',
      rate: 120.5,
      estimatedDays: 4,
      currency: 'INR',
    });
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/kinko/v1/invoice/charges'),
      expect.objectContaining({
        headers: { Authorization: 'Token test-api-key' },
        params: expect.objectContaining({
          md: 'E', // COD mode
          cgm: 1000, // weight in grams
        }),
      }),
    );
  });

  it('should create label with waybill', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: ['DHL123456789'] });
    mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

    const request: CreateLabelRequest = {
      orderId: 'ORD-123',
      origin: {
        pincode: '110001',
        city: 'Delhi',
        state: 'Delhi',
        country: 'India',
        name: 'Seller',
        phone: '1234567890',
        addressLine1: 'Address',
      },
      destination: {
        pincode: '560001',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        name: 'Buyer',
        phone: '0987654321',
        addressLine1: 'Address',
      },
      parcel: { weight: 1, length: 10, breadth: 10, height: 10 },
      paymentMode: 'prepaid',
    };

    const label = await adapter.createLabel(request);

    expect(label.awbCode).toBe('DHL123456789');
    expect(label.courierName).toBe('Delhivery');
    expect(label.pickupScheduled).toBe(true);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/waybill/api/bulk/json/'),
      expect.any(Object),
    );
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/cmu/create.json'),
      expect.any(String),
      expect.any(Object),
    );
  });

  it('should track shipment', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        ShipmentData: [
          {
            Shipment: {
              Status: { Status: 'Delivered' },
              Scans: [
                {
                  ScanDateTime: '2024-01-05T10:30:00Z',
                  ScannedLocation: 'Bangalore',
                  ScanType: 'Delivered',
                  Instructions: 'Package delivered',
                },
                {
                  ScanDateTime: '2024-01-05T08:00:00Z',
                  ScannedLocation: 'Bangalore Hub',
                  ScanType: 'Out for Delivery',
                  Instructions: '',
                },
              ],
            },
          },
        ],
      },
    });

    const request: TrackShipmentRequest = { awbCode: 'DHL123456789' };
    const tracking = await adapter.trackShipment(request);

    expect(tracking.status).toBe('delivered');
    expect(tracking.currentLocation).toBe('Bangalore');
    expect(tracking.activities).toHaveLength(2);
    expect(tracking.activities[0].status).toBe('Delivered');
  });

  it('should handle missing tracking data gracefully', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: {} });

    const request: TrackShipmentRequest = { awbCode: 'DHL123456789' };
    const tracking = await adapter.trackShipment(request);

    expect(tracking.status).toBe('pending');
    expect(tracking.activities).toEqual([]);
  });
});

describe('Shipping Factory', () => {
  beforeEach(() => {
    delete process.env.SHIPPING_PROVIDER;
  });

  it('should return default shiprocket adapter', () => {
    const adapter = getShippingAdapter();
    expect(adapter.name).toBe('Shiprocket');
  });

  it('should return adapter by provider name', () => {
    const adapter = getShippingAdapter('delhivery');
    expect(adapter.name).toBe('Delhivery');
  });

  it('should use env var if set', () => {
    process.env.SHIPPING_PROVIDER = 'delhivery';
    const adapter = getShippingAdapter();
    expect(adapter.name).toBe('Delhivery');
  });

  it('should throw on unsupported provider', () => {
    expect(() => getShippingAdapter('invalid' as any)).toThrow('Unsupported shipping provider');
  });

  it('should allow custom adapter registration', () => {
    const mockAdapter = {
      name: 'MockShipping',
      rateQuote: jest.fn(),
      createLabel: jest.fn(),
      trackShipment: jest.fn(),
    };
    registerShippingAdapter('shiprocket', mockAdapter);
    const adapter = getShippingAdapter('shiprocket');
    expect(adapter.name).toBe('MockShipping');
  });
});
