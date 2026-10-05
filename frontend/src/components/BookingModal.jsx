import { useState } from 'react';
import api from '../api/client.js';

export default function BookingModal({ event, onClose, onBooked }) {
  const [tickets, setTickets] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const eventDate = new Date(event.event_date).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit'
  });

  const confirmBooking = async (formEvent) => {
    formEvent.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/bookings', { event_id: event.id, tickets });
      onBooked(data.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not complete your booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-title">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close booking">×</button>
        <span className="eyebrow">SAVE YOUR SEAT</span>
        <h2 id="booking-title">You're almost there.</h2>
        <p className="modal-event-title">{event.title}</p>
        <div className="modal-event-info"><span>{eventDate}</span><span>{event.location}</span></div>
        <form onSubmit={confirmBooking}>
          <label className="ticket-label" htmlFor="ticket-count">Number of tickets</label>
          <div className="ticket-stepper">
            <button type="button" aria-label="Remove one ticket" onClick={() => setTickets((count) => Math.max(1, count - 1))} disabled={tickets <= 1}>−</button>
            <input id="ticket-count" type="number" min="1" max={Math.min(20, event.available_seats)} value={tickets} onChange={(inputEvent) => setTickets(Math.min(Math.max(1, Number(inputEvent.target.value) || 1), Math.min(20, event.available_seats)))} />
            <button type="button" aria-label="Add one ticket" onClick={() => setTickets((count) => Math.min(Math.min(20, event.available_seats), count + 1))} disabled={tickets >= Math.min(20, event.available_seats)}>+</button>
          </div>
          <div className="modal-total"><span>Total</span><strong>{Number(event.price) === 0 ? 'Free' : `$${(Number(event.price) * tickets).toFixed(2)}`}</strong></div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-full" type="submit" disabled={loading}>{loading ? 'Confirming…' : 'Confirm booking'}</button>
          <button className="text-button modal-cancel" type="button" onClick={onClose} disabled={loading}>Maybe later</button>
        </form>
      </section>
    </div>
  );
}