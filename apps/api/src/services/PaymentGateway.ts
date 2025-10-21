// Stub for PaymentGateway
export const PaymentGateway = {
  async refund(paymentIntentId: string, amount: number) {
    // Simulate refund
    return `refund-${paymentIntentId}-${amount}`;
  },
};
