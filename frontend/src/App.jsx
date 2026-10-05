import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import Events from './pages/Events.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import MyBookings from './pages/MyBookings.jsx';
import NotFound from './pages/NotFound.jsx';
import AdminEvents from './pages/AdminEvents.jsx';
import AdminBookings from './pages/AdminBookings.jsx';
import './styles/global.css';

function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/events" replace />} />
          <Route path="/events" element={<Events />} />
          <Route path="/login" element={<ProtectedRoute guestsOnly><Login /></ProtectedRoute>} />
          <Route path="/register" element={<ProtectedRoute guestsOnly><Register /></ProtectedRoute>} />
          <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/admin/events" element={<ProtectedRoute adminOnly><AdminEvents /></ProtectedRoute>} />
          <Route path="/admin/bookings" element={<ProtectedRoute adminOnly><AdminBookings /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default function App() {
  return <AppRoutes />;
}