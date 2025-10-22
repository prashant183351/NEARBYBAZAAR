import axios from 'axios';

// BNPL Provider API configuration
const BNPL_API_BASE_URL = process.env.BNPL_API_BASE_URL || '';
const BNPL_API_KEY = process.env.BNPL_API_KEY || '';

// Function to initiate a BNPL credit check
export const initiateCreditCheck = async (buyerId: string, amount: number) => {
  try {
    const response = await axios.post(
      `${BNPL_API_BASE_URL}/credit-check`,
      { buyerId, amount },
      { headers: { Authorization: `Bearer ${BNPL_API_KEY}` } },
    );
    return response.data;
  } catch (error) {
    console.error('Error initiating BNPL credit check:', error);
    throw new Error('Failed to initiate credit check');
  }
};

// Function to create a BNPL order
export const createBnplOrder = async (
  orderId: string,
  buyerId: string,
  amount: number,
  tenure: number,
) => {
  try {
    const response = await axios.post(
      `${BNPL_API_BASE_URL}/create-order`,
      { orderId, buyerId, amount, tenure },
      { headers: { Authorization: `Bearer ${BNPL_API_KEY}` } },
    );
    return response.data;
  } catch (error) {
    console.error('Error creating BNPL order:', error);
    throw new Error('Failed to create BNPL order');
  }
};
