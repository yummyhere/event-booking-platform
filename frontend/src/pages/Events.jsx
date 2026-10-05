import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import EventCard from '../components/EventCard.jsx';
import SearchFilters from '../components/SearchFilters.jsx';
import BookingModal from '../components/BookingModal.jsx';
import Loader from '../components/Loader.jsx';
import Toast from '../components/Toast.jsx';

export default function Events() {
  const [filters, setFilters] = useState({ search: '', category: '', date: '', upcoming: true });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [toast, setToast] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [toastType, setToastType] = useState('success');

  useEffect(() => {
    if (location.state?.accessDenied) {
      setToastType('error');
      setToast('Access denied. This area is for administrators only.');
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => window.clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.get('/events', { params: { search: debouncedSearch, category: filters.category, date: filters.date, upcoming: String(filters.upcoming) } })
      .then(({ data }) => { if (active) setEvents(data.data); })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Events could not be loaded. Check your connection and try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [debouncedSearch, filters.category, filters.date, filters.upcoming, refreshKey]);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const openBooking = (event) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/events' }, message: 'Log in to reserve your spot.' } });
      return;
    }
    setSelectedEvent(event);
  };
  const bookingComplete = () => {
    setSelectedEvent(null);
    setToastType('success');
    setToast('Your spot is confirmed. See you there!');
    setRefreshKey((key) => key + 1);
  };

  return (
    <main>
      <section className="discovery-hero">
        <div className="hero-copy">
          <p className="eyebrow">GOOD THINGS HAPPEN TOGETHER</p>
          <h1>Find your<br /><span>kind of people.</span></h1>
          <p className="hero-description">Small gatherings, new ideas, familiar faces. Your next favorite thing is closer than you think.</p>
          <a href="#event-list" className="hero-link">Explore what's on <span aria-hidden="true">↓</span></a>
        </div>
        <div className="hero-art" aria-label="Friends sharing a meal at a community gathering" role="img">
          <div className="hero-note"><span className="note-dot" /> Find your people, offline.</div>
          <div className="hero-index">01 <span>/</span> COMMUNITY</div>
        </div>
        <div className="hero-side-note">A little more together<br />goes a long way.</div>
      </section>
      <section className="events-section" id="event-list">
        <div className="section-heading">
          <div><p className="eyebrow">THE COMMUNITY CALENDAR</p><h2>Make a day of it.</h2></div>
          <p>Gather close. Leave with a story.</p>
        </div>
        <SearchFilters filters={filters} onChange={updateFilter} onReset={() => setFilters({ search: '', category: '', date: '', upcoming: false })} />
        {loading ? <Loader label="Finding your next plan" /> : error ? (
          <div className="state-panel state-error"><h3>We hit a little snag.</h3><p>{error}</p><button className="button" onClick={() => setRefreshKey((key) => key + 1)}>Try again</button></div>
        ) : events.length ? (
          <div className="event-grid">{events.map((event) => <EventCard key={event.id} event={event} onBook={openBooking} />)}</div>
        ) : (
          <div className="state-panel"><span className="empty-mark">○</span><h3>No events found</h3><p>Try another search or clear a filter to see what's happening.</p><button className="text-button" onClick={() => setFilters({ search: '', category: '', date: '', upcoming: false })}>Clear all filters</button></div>
        )}
        {!isAuthenticated && <p className="browse-note">Going somewhere? <Link to="/register">Create a free account</Link> to save your seat.</p>}
      </section>
      {selectedEvent && <BookingModal event={selectedEvent} onClose={() => setSelectedEvent(null)} onBooked={bookingComplete} />}
      <Toast message={toast} type={toastType} onDismiss={() => setToast('')} />
    </main>
  );
}