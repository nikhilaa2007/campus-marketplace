import { Router } from 'express';
import {
  createListing, getListings, getMyListings, getListing, updateListing, deleteListing,
} from '../controllers/listingController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect); // marketplace is for logged-in, verified students only

router.get('/', getListings);
router.post('/', createListing);
router.get('/mine', getMyListings); // must stay above '/:id'
router.get('/:id', getListing);
router.put('/:id', updateListing);
router.delete('/:id', deleteListing);

export default router;
