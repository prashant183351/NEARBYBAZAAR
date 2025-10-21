import { Router } from 'express';
import * as bookings from '../controllers/bookings';

const router = Router();

router.post('/', bookings.createBooking);
// More endpoints to be added in later chunks

export default router;
