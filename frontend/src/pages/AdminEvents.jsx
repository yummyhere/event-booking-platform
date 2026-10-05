import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import AdminStats from '../components/AdminStats.jsx';
import EventForm from '../components/EventForm.jsx';
import Loader from '../components/Loader.jsx';
import Toast from '../components/Toast.jsx';

const eventDate = (value) => new Date(value).toLocaleString('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
});

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingEvent, setEditingEvent] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState('success');

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/events');
      setEvents(data.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Events could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const saveEvent = async (eventData) => {
    if (editingEvent) await api.put(`/events/${editingEvent.id}`, eventData);
    else await api.post('/events', eventData);
    setShowForm(false);
    setEditingEvent(null);
    setToastType('success');
    setToast(editingEvent ? 'Event updated.' : 'Event created.');
    await loadEvents();
  };

  const deleteEvent = async (event) => {
    if (!window.confirm(`Delete “${event.title}”? Related bookings will also be removed.`)) return;
    try {
      await api.delete(`/events/${event.id}`);
      setToastType('success');
      setToast('Event deleted.');
      await loadEvents();
    } catch (requestError) {
      setToastType('error');
      setToast(requestError.response?.data?.message || 'The event could not be deleted.');
    }
  };

  const openEdit = (event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const openCreate = () => {
    setEditingEvent(null);
    setShowForm(true);
  };

  return (
    <main className="admin-page">
      <div className="admin-heading">
        <div><p className="eyebrow">GATHER ADMINISTRATION</p><h1>Manage events<span className="heading-period">.</span></h1><p>Create and update the community calendar.</p><Link className="admin-secondary-link" to="/admin/bookings">View all bookings →</Link></div>
        <button className="button" onClick={openCreate}>+ Add Event</button>
      </div>
      <AdminStats />
      <section className="admin-section">
        <div className="admin-section-heading"><div><h2>All events</h2><span>{events.length} total</span></div><button className="text-button" onClick={loadEvents}>Refresh</button></div>
        {loading ? <Loader label="Loading events" /> : error ? (
          <div className="state-panel state-error"><p>{error}</p><button className="button" onClick={loadEvents}>Try again</button></div>
        ) : events.length === 0 ? (
          <div className="state-panel"><h3>No events yet</h3><p>Add the first event to start filling the calendar.</p><button className="button" onClick={openCreate}>Add Event</button></div>
        ) : (
          <div className="admin-table-scroll"><table className="admin-table">
            <thead><tr><th>Event</th><th>Category</th><th>Date</th><th>Price</th><th>Total seats</th><th>Available</th><th>Actions</th></tr></thead>
            <tbody>{events.map((event) => <tr key={event.id}>
              <td className="admin-event-title">{event.title}</td><td>{event.category}</td><td>{eventDate(event.event_date)}</td>
              <td>{Number(event.price) === 0 ? 'Free' : `$${Number(event.price).toFixed(2)}`}</td><td>{event.total_seats}</td><td>{event.available_seats}</td>
              <td><div className="admin-row-actions"><button className="admin-action" onClick={() => openEdit(event)}>Edit</button><button className="admin-action admin-action-danger" onClick={() => deleteEvent(event)}>Delete</button></div></td>
            </tr>)}</tbody>
          </table></div>
        )}
      </section>
      {showForm && <EventForm key={editingEvent?.id || 'new-event'} initialEvent={editingEvent} onSave={saveEvent} onCancel={() => setShowForm(false)} />}
      <Toast message={toast} type={toastType} onDismiss={() => setToast('')} />
    </main>
  );
}