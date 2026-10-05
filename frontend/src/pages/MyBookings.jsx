import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import Loader from '../components/Loader.jsx';

const dateFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [cancelingId, setCancelingId] = useState(null);
  const [notice, setNotice] = useState('');

  const loadBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/user/bookings');
      setBookings(data.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Your bookings could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBookings(); }, []);

  const cancel = async (bookingId) => {
    setCancelingId(bookingId);
    setNotice('');
    try {
      await api.patch(`/bookings/${bookingId}/cancel`);
      setNotice('Booking cancelled and seats released.');
      await loadBookings();
    } catch (requestError) {
      setNotice(requestError.response?.data?.message || 'Could not cancel this booking.');
    } finally {
      setCancelingId(null);
    }
  };

  const activeBookings = bookings.filter((booking) => booking.is_upcoming && booking.status === 'confirmed');
  const pastBookings = bookings.filter((booking) => !booking.is_upcoming || booking.status !== 'confirmed');
  const visibleBookings = activeTab === 'active' ? activeBookings : pastBookings;

  return (
    <main className="dashboard-page">
      <div className="dashboard-heading"><div><p className="eyebrow">YOUR PLANS, ALL IN ONE PLACE</p><h1>My bookings<span className="heading-period">.</span></h1><p>Every good plan starts somewhere.</p></div><Link className="button" to="/events">Find an event <span aria-hidden="true">→</span></Link></div>
      <div className="booking-tabs" role="tablist" aria-label="Booking history">
        <button role="tab" aria-selected={activeTab === 'active'} className={activeTab === 'active' ? 'booking-tab selected' : 'booking-tab'} onClick={() => setActiveTab('active')}>Active bookings <span>{activeBookings.length}</span></button>
        <button role="tab" aria-selected={activeTab === 'past'} className={activeTab === 'past' ? 'booking-tab selected' : 'booking-tab'} onClick={() => setActiveTab('past')}>Past bookings <span>{pastBookings.length}</span></button>
      </div>
      {notice && <p className="dashboard-notice" role="status">{notice}</p>}
      {loading ? <Loader label="Loading your bookings" /> : error ? (
        <div className="state-panel state-error"><h3>Bookings are taking a moment.</h3><p>{error}</p><button className="button" onClick={loadBookings}>Try again</button></div>
      ) : visibleBookings.length ? (
        <div className="booking-list">{visibleBookings.map((booking) => (
          <article className="booking-row" key={booking.id}>
            <div className="booking-date-block"><span>{new Date(booking.event_date).toLocaleDateString('en-US', { month: 'short' })}</span><strong>{new Date(booking.event_date).getDate()}</strong><small>{new Date(booking.event_date).getFullYear()}</small></div>
            <div className="booking-main"><span className="eyebrow">{booking.is_upcoming ? 'UPCOMING' : 'PAST EVENT'}</span><h2>{booking.title}</h2><p>{dateFormatter.format(new Date(booking.event_date))} · {new Date(booking.event_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p><p>{booking.location}</p></div>
            <div className="booking-meta"><span className={`status-pill status-${booking.status}`}>{booking.status}</span><span>{booking.tickets} {booking.tickets === 1 ? 'ticket' : 'tickets'}</span><strong>{Number(booking.total_price) === 0 ? 'Free' : `$${Number(booking.total_price).toFixed(2)}`}</strong><small>Booked {new Date(booking.booked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</small></div>
            {booking.is_upcoming && booking.status === 'confirmed' && <button className="cancel-booking" disabled={cancelingId === booking.id} onClick={() => cancel(booking.id)}>{cancelingId === booking.id ? 'Cancelling…' : 'Cancel'}</button>}
          </article>
        ))}</div>
      ) : (
        <div className="state-panel"><span className="empty-mark">○</span><h3>{activeTab === 'active' ? 'Nothing on the calendar yet.' : 'Your story starts here.'}</h3><p>{activeTab === 'active' ? 'Find something lovely to look forward to.' : 'Once you have been to an event, you will find it here.'}</p><Link className="button" to="/events">Browse events <span aria-hidden="true">→</span></Link></div>
      )}
    </main>
  );
}