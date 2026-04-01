import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';

import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import AgencySignup from './pages/AgencySignup.jsx';
import AdminSetup from './pages/AdminSetup.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AgencyLogin from './pages/AgencyLogin.jsx';

import Tours from './pages/Tours.jsx';
import TourDetail from './pages/TourDetail.jsx';
import Wishlist from './pages/Wishlist.jsx';
import Bookings from './pages/Bookings.jsx';
import Payment from './pages/Payment.jsx';
import Notifications from './pages/Notifications.jsx';
import Support from './pages/Support.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';

import Admin from './pages/Admin.jsx';
import Agency from './pages/Agency.jsx';

import RequireAdmin from './components/RequireAdmin.jsx';
import RequireAgency from './components/RequireAgency.jsx';




export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />

        <Route path="/tours" element={<Tours />} />
        <Route path="/tours/:id" element={<TourDetail />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/agency-signup" element={<AgencySignup />} />
        <Route path="/admin-setup" element={<AdminSetup />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/agency-login" element={<AgencyLogin />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/payment/:bookingId" element={<Payment />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/support" element={<Support />} />

        

        <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
        <Route path="/agency" element={<RequireAgency><Agency /></RequireAgency>} />

        <Route path="*" element={<Home />} />
      </Routes>
    </Layout>
  );
}