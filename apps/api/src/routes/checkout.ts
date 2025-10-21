import { Router } from 'express';
import { validate } from '../middleware/validate';
import { idempotency } from '../middleware/idempotency';
import {
  AddToCartBody,
  SetAddressBody,
  ShippingBody,
  PayBody,
  ConfirmBody,
  getCart,
  addToCart,
  setAddress,
  shipping,
  pay,
  confirm,
} from '../controllers/checkout';

const router = Router();

// Cart retrieval
router.get('/cart', getCart);

// Add item to cart

// Set addresses

// Shipping options and selection

// Initiate payment intent

// Confirm with idempotency to avoid duplicate order creation
router.post(
  '/checkout/confirm',
  idempotency({ required: true }),
  validate(ConfirmBody),
  confirm
);
// Removed stray closing parenthesis
router.post('/cart', validate(AddToCartBody), addToCart);

// Set addresses
router.post('/checkout/address', validate(SetAddressBody), setAddress);

// Shipping options and selection
router.post('/checkout/shipping', validate(ShippingBody), shipping);

// Initiate payment intent
router.post('/checkout/pay', validate(PayBody), pay);

// ...existing code...

export default router;
