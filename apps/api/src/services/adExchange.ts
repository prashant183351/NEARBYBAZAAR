export interface BidRequest {
  impressionId: string;
  adSlotId: string;
  bids: Array<{
    advertiserId: string;
    bidAmount: number; // In cost per thousand impressions (CPM)
  }>;
}

export interface BidResponse {
  impressionId: string;
  winningAdvertiserId: string;
  winningBidAmount: number; // Converted to cost per impression
}

/**
 * Evaluate bids and select the winning advertiser.
 * @param bidRequest The bid request containing all bids for an impression opportunity.
 * @returns The winning bid response.
 */
export const evaluateBids = async (bidRequest: BidRequest): Promise<BidResponse> => {
  const { impressionId, bids } = bidRequest;

  if (bids.length === 0) {
    throw new Error('No bids provided');
  }

  // Select the highest bid
  const winningBid = bids.reduce((highest, current) => {
    return current.bidAmount > highest.bidAmount ? current : highest;
  });

  return {
    impressionId,
    winningAdvertiserId: winningBid.advertiserId,
    winningBidAmount: winningBid.bidAmount / 1000, // Convert CPM to cost per impression
  };
};
