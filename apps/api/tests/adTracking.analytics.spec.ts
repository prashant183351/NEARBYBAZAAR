  it('getCampaignAnalytics handles no clicks', async () => {
    require('../src/models/AdClick').AdClick.find = jest.fn().mockResolvedValue([]);
    const result = await adTracking.getCampaignAnalytics('cid');
    expect(result.totalClicks).toBe(0);
    expect(result.totalCost).toBe(0);
    expect(result.conversions).toBe(0);
    expect(result.conversionRate).toBe(0);
    expect(result.avgCostPerClick).toBe(0);
    expect(result.costPerConversion).toBe(0);
    expect(result.clicksByDate).toEqual({});
    expect(result.costByDate).toEqual({});
    expect(result.clicksByPlacement).toEqual({});
    expect(result.clicksByKeyword).toEqual({});
  });

  it('getVendorAnalytics handles no clicks or campaigns', async () => {
    require('../src/models/AdClick').AdClick.find = jest.fn().mockResolvedValue([]);
    require('../src/models/AdCampaign').AdCampaign.find = jest.fn().mockResolvedValue([]);
    const result = await adTracking.getVendorAnalytics('vid');
    expect(result.totalCampaigns).toBe(0);
    expect(result.activeCampaigns).toBe(0);
    expect(result.totalImpressions).toBe(0);
    expect(result.avgCTR).toBe(0);
    expect(result.totalSpend).toBe(0);
    expect(result.conversions).toBe(0);
  });

  it('getCampaignAnalytics handles clicks with missing fields', async () => {
    const badClicks = [
      { cost: 0, convertedToOrder: false, clickedAt: new Date('2025-10-03T10:00:00Z') },
      { cost: 0, convertedToOrder: false, clickedAt: new Date('2025-10-03T11:00:00Z') },
    ];
    require('../src/models/AdClick').AdClick.find = jest.fn().mockResolvedValue(badClicks);
    const result = await adTracking.getCampaignAnalytics('cid');
    expect(result.totalClicks).toBe(2);
    expect(result.clicksByDate['2025-10-03']).toBe(2);
    expect(result.clicksByPlacement).toEqual({ undefined: 2 });
    expect(result.clicksByKeyword).toEqual({});
  });

  // Skipped: chargeVendorWallet is not exported; covered via recordClick error path

import * as adTracking from '../src/services/adTracking';

const mockClicks = [
  { cost: 10, convertedToOrder: true, clickedAt: new Date('2025-10-01T10:00:00Z'), placement: 'main', keyword: 'foo', ipAddress: '1.2.3.4', sessionId: 'sess1' },
  { cost: 20, convertedToOrder: false, clickedAt: new Date('2025-10-01T11:00:00Z'), placement: 'main', keyword: 'bar', ipAddress: '1.2.3.4', sessionId: 'sess1' },
  { cost: 30, convertedToOrder: false, clickedAt: new Date('2025-10-02T10:00:00Z'), placement: 'side', keyword: 'foo', ipAddress: '5.6.7.8', sessionId: 'sess2' },
  { cost: 40, convertedToOrder: false, clickedAt: new Date('2025-10-02T12:00:00Z'), placement: 'side', keyword: undefined, ipAddress: '5.6.7.8', sessionId: 'sess2' },
];

const mockCampaigns = [
  { impressions: 100, ctr: 0.1, status: 'active' },
  { impressions: 200, ctr: 0.2, status: 'paused' },
];

describe('adTracking analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getCampaignAnalytics returns correct aggregates', async () => {
    jest.resetModules();
    const AdClick = { find: jest.fn().mockResolvedValue(mockClicks) };
    jest.doMock('../src/models/AdClick', () => ({ AdClick }));
    const adTracking = require('../src/services/adTracking');
    const result = await adTracking.getCampaignAnalytics('cid');
    expect(result.totalClicks).toBe(4);
    expect(result.totalCost).toBe(100);
    expect(result.conversions).toBe(1);
    expect(result.conversionRate).toBeCloseTo(0.25);
    expect(result.avgCostPerClick).toBeCloseTo(25);
    expect(result.costPerConversion).toBeCloseTo(100);
    expect(result.clicksByDate['2025-10-01']).toBe(2);
    expect(result.clicksByDate['2025-10-02']).toBe(2);
    expect(result.clicksByPlacement['main']).toBe(2);
    expect(result.clicksByPlacement['side']).toBe(2);
    expect(result.clicksByKeyword['foo']).toBe(2);
    expect(result.clicksByKeyword['bar']).toBe(1);
  });

  it('getVendorAnalytics returns correct aggregates', async () => {
    jest.resetModules();
    const AdClick = { find: jest.fn().mockResolvedValue(mockClicks) };
    const AdCampaign = { find: jest.fn().mockResolvedValue(mockCampaigns) };
    jest.doMock('../src/models/AdClick', () => ({ AdClick }));
    jest.doMock('../src/models/AdCampaign', () => ({ AdCampaign }));
    const adTracking = require('../src/services/adTracking');
    const result = await adTracking.getVendorAnalytics('vid');
    expect(result.totalCampaigns).toBe(2);
    expect(result.activeCampaigns).toBe(1);
    expect(result.totalImpressions).toBe(300);
    expect(result.avgCTR).toBeCloseTo(0.15);
    expect(result.totalSpend).toBe(100);
    expect(result.conversions).toBe(1);
  });

  it('detectFraudPatterns returns high risk for rapid IP and session', async () => {
    jest.resetModules();
    const fraudClicks = [];
    for (let i = 0; i < 12; ++i) {
      fraudClicks.push({ ipAddress: '1.2.3.4', sessionId: 'sessX', convertedToOrder: false, clickedAt: new Date() });
    }
    const AdClick = { find: jest.fn().mockResolvedValue(fraudClicks) };
    jest.doMock('../src/models/AdClick', () => ({ AdClick }));
    const adTracking = require('../src/services/adTracking');
    const result = await adTracking.detectFraudPatterns('cid', 24);
  expect(result.suspiciousPatterns.some((p: string) => p.includes('IP'))).toBe(true);
  expect(result.suspiciousPatterns.some((p: string) => p.includes('session'))).toBe(true);
    expect(result.fraudRisk).toBe('high');
  });

  it('detectFraudPatterns returns low risk for normal pattern', async () => {
    require('../src/models/AdClick').AdClick.find = jest.fn().mockResolvedValue(mockClicks);
    const result = await adTracking.detectFraudPatterns('cid', 24);
    expect(result.fraudRisk).toBe('low');
    expect(result.suspiciousPatterns.length).toBe(0);
  });
});
