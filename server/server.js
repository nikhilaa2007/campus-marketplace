import 'dotenv/config';
import 'express-async-errors'; // lets Express catch errors thrown in async handlers
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/wishlist', wishlistRoutes);
// Next: chat (Phase 2), ratings, reports ...

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server' });
});

await connectDB();
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
