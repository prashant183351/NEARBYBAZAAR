// Stub for CommissionService
export const CommissionService = {
  async adjustForRefund(orderId: string, refundAmount: number) {
    // Simulate commission adjustment
    return `commission-adjust-${orderId}-${refundAmount}`;
  },
};
