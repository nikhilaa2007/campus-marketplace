import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import Login from './pages/Login';
import Browse from './pages/Browse';
import ListingDetail from './pages/ListingDetail';
import ListingForm from './pages/ListingForm';
import MyListings from './pages/MyListings';
import Requests from './pages/Requests';
import Receipt from './pages/Receipt';
import Wishlist from './pages/Wishlist';

export default function App() {
  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/verify" element={<VerifyOtp />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Browse />} />
        <Route path="/listings/new" element={<ListingForm />} />
        <Route path="/listings/:id" element={<ListingDetail />} />
        <Route path="/listings/:id/edit" element={<ListingForm />} />
        <Route path="/my-listings" element={<MyListings />} />
        <Route path="/my-requests" element={<Requests role="buyer" />} />
        <Route path="/requests-received" element={<Requests role="seller" />} />
        <Route path="/receipts/:id" element={<Receipt />} />
        <Route path="/wishlist" element={<Wishlist />} />
      </Route>
    </Routes>
  );
}
