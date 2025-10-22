import * as creditLedger from '../src/services/creditLedger';

const mockBuyerCredit = {
  save: jest.fn(),
  status: 'pending',
  userId: 'user1',
};

var saveMock: jest.Mock;
var newBuyerCredit: any;
var BuyerCreditFindOne: jest.Mock;
var BuyerCreditConstructor: jest.Mock;

jest.mock('../src/models/CreditTerm', () => {
  saveMock = jest.fn();
  newBuyerCredit = { save: saveMock };
  BuyerCreditFindOne = jest.fn();
  BuyerCreditConstructor = jest.fn(() => newBuyerCredit);
  return {
    BuyerCredit: Object.assign(BuyerCreditConstructor, {
      findOne: BuyerCreditFindOne,
    }),
  };
});

// Remove global bson mock to avoid breaking Mongoose internals
// Instead, patch ObjectId locally in the test if needed

describe('creditLedger.applyForCredit', () => {
  let objectIdSpy: jest.SpyInstance;
  beforeEach(() => {
    jest.clearAllMocks();
    BuyerCreditFindOne.mockReset();
    BuyerCreditConstructor.mockClear();
    saveMock.mockClear();
    // Patch Types.ObjectId to avoid BSONError
    const { Types } = require('mongoose');
    if (!Types.ObjectId._isMockFunction) {
      objectIdSpy = jest.spyOn(Types, 'ObjectId').mockImplementation(() => 'dummyObjectId');
    }
  });
  afterEach(() => {
    if (objectIdSpy) objectIdSpy.mockRestore();
  });

  it('throws if already approved', async () => {
    BuyerCreditFindOne.mockResolvedValue({ ...mockBuyerCredit, status: 'approved' });
    await expect(creditLedger.applyForCredit('user1', 1000)).rejects.toThrow('Credit already approved. Request increase instead.');
  });

  it('throws if already pending', async () => {
    BuyerCreditFindOne.mockResolvedValue({ ...mockBuyerCredit, status: 'pending' });
    await expect(creditLedger.applyForCredit('user1', 1000)).rejects.toThrow('Credit application already pending review.');
  });

  it('creates new application if none exists', async () => {
    BuyerCreditFindOne.mockResolvedValue(null);
    const result = await creditLedger.applyForCredit('user1', 1000, 'note');
    expect(BuyerCreditConstructor).toHaveBeenCalled();
    expect(saveMock).toHaveBeenCalled();
    expect(result).toBe(newBuyerCredit);
  });
});
