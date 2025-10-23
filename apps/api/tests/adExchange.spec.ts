import { evaluateBids, BidRequest, BidResponse } from '../src/services/adExchange';

describe('adExchange.evaluateBids', () => {
  it('selects the highest bid and returns CPM as cost per impression', async () => {
    const bidRequest: BidRequest = {
      impressionId: 'imp1',
      adSlotId: 'slotA',
      bids: [
        { advertiserId: 'adv1', bidAmount: 2000 }, // $2.00 CPM
        { advertiserId: 'adv2', bidAmount: 3500 }, // $3.50 CPM
        { advertiserId: 'adv3', bidAmount: 1500 }, // $1.50 CPM
      ],
    };
    const result: BidResponse = await evaluateBids(bidRequest);
    expect(result.impressionId).toBe('imp1');
    expect(result.winningAdvertiserId).toBe('adv2');
    expect(result.winningBidAmount).toBeCloseTo(3.5, 5); // $3.50 CPM as cost per impression
  });

  it('throws if no bids are provided', async () => {
    const bidRequest: BidRequest = {
      impressionId: 'imp2',
      adSlotId: 'slotB',
      bids: [],
    };
    await expect(evaluateBids(bidRequest)).rejects.toThrow('No bids provided');
  });

  it('returns the first highest bid if there is a tie', async () => {
    const bidRequest: BidRequest = {
      impressionId: 'imp3',
      adSlotId: 'slotC',
      bids: [
        { advertiserId: 'adv1', bidAmount: 5000 },
        { advertiserId: 'adv2', bidAmount: 5000 },
        { advertiserId: 'adv3', bidAmount: 3000 },
      ],
    };
    const result: BidResponse = await evaluateBids(bidRequest);
    // Should pick the first adv1 (reduce logic)
    expect(result.winningAdvertiserId).toBe('adv1');
    expect(result.winningBidAmount).toBeCloseTo(5.0, 5);
  });
});
