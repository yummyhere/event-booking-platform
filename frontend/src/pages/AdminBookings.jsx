import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import AdminStats from '../components/AdminStats.jsx';
import Loader from '../components/Loader.jsx';

const bookedDate = (value) => new Date(value).toLocaleString('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
});

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/bookings')
      .then(({ data }) => setBookings(data.data))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Bookings could not be loaded.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="admin-page">
      <div className="admin-heading"><div><p className="eyebrow">GATHER ADMINISTRATION</p><h1>All bookings<span className="heading-period">.</span></h1><p>Reservations across the community.</p><Link className="admin-secondary-link" to="/admin/events">Manage events →</Link></div></div>
      <AdminStats />
      <section className="admin-section">
        <div className="admin-section-heading"><div><h2>Booking history</h2><span>{bookings.length} total</span></div></div>
        {loading ? <Loader label="Loading bookings" /> : error ? (
          <div className="state-panel state-error"><p>{error}</p></div>
        ) : bookings.length === 0 ? (
          <div className="state-panel"><h3>No bookings yet</h3><p>New community reservations will appear here.</p></div>
        ) : (
          <div className="admin-table-scroll"><table className="admin-table">
            <thead><tr><th>Member</th><th>Event</th><th>Tickets</th><th>Total</th><th>Status</th><th>Booked</th></tr></thead>
            <tbody>{bookings.map((booking) => <tr key={booking.id}>
              <td><strong className="admin-member-name">{booking.user_name}</strong><span className="admin-member-email">{booking.user_email}</span></td>
              <td className="admin-event-title">{booking.event_title}</td><td>{booking.tickets}</td>
              <td>{Number(booking.total_price) === 0 ? 'Free' : `$${Number(booking.total_price).toFixed(2)}`}</td>
              <td><span className={`status-pill status-${booking.status}`}>{booking.status}</span></td><td>{bookedDate(booking.booked_at)}</td>
            </tr>)}</tbody>
          </table></div>
        )}
      </section>
    </main>
  );
}