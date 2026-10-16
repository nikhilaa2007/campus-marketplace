import { Router } from 'express';
import { getWishlist, getWishlistIds, addToWishlist, removeFromWishlist } from '../controllers/wishlistController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', getWishlist);
router.get('/ids', getWishlistIds); // must stay above the :listingId routes
router.post('/:listingId', addToWishlist);
router.delete('/:listingId', removeFromWishlist);

export default router;
