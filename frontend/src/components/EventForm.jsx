import { useState } from 'react';

function asLocalDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function EventForm({ initialEvent, onSave, onCancel }) {
  const [form, setForm] = useState(() => ({
    title: initialEvent?.title || '',
    description: initialEvent?.description || '',
    category: initialEvent?.category || '',
    location: initialEvent?.location || '',
    event_date: asLocalDateTime(initialEvent?.event_date),
    price: initialEvent?.price ?? '0',
    total_seats: initialEvent?.total_seats ?? '1',
    image_url: initialEvent?.image_url || ''
  }));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    const date = new Date(form.event_date);
    if (Number.isNaN(date.getTime())) {
      setError('Enter a valid event date and time.');
      return;
    }
    if (!form.title.trim() || !form.category.trim() || !form.location.trim()) {
      setError('Title, category, and location are required.');
      return;
    }
    if (Number(form.price) < 0 || !Number.isFinite(Number(form.price))) {
      setError('Price must be zero or greater.');
      return;
    }
    if (!Number.isInteger(Number(form.total_seats)) || Number(form.total_seats) < 1) {
      setError('Total seats must be a whole number greater than zero.');
      return;
    }

    setSaving(true);
    try {
      await onSave({ ...form, event_date: date.toISOString(), price: Number(form.price), total_seats: Number(form.total_seats) });
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'The event could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section className="admin-form-modal" role="dialog" aria-modal="true" aria-labelledby="event-form-title">
        <button className="modal-close" type="button" onClick={onCancel} aria-label="Close event form">×</button>
        <p className="eyebrow">EVENT DETAILS</p>
        <h2 id="event-form-title">{initialEvent ? 'Edit event' : 'Add an event'}</h2>
        <form className="admin-event-form" onSubmit={submit}>
          <label>Title<input required minLength="2" maxLength="160" value={form.title} onChange={(event) => update('title', event.target.value)} /></label>
          <label>Category<input required value={form.category} onChange={(event) => update('category', event.target.value)} /></label>
          <label>Location<input required value={form.location} onChange={(event) => update('location', event.target.value)} /></label>
          <label>Event date and time<input required type="datetime-local" value={form.event_date} onChange={(event) => update('event_date', event.target.value)} /></label>
          <label>Price<input required type="number" min="0" step="0.01" value={form.price} onChange={(event) => update('price', event.target.value)} /></label>
          <label>Total seats<input required type="number" min="1" step="1" value={form.total_seats} onChange={(event) => update('total_seats', event.target.value)} /></label>
          <label className="admin-form-wide">Image URL<input type="url" value={form.image_url} onChange={(event) => update('image_url', event.target.value)} placeholder="https://example.com/event.jpg" /></label>
          <label className="admin-form-wide">Description<textarea rows="3" maxLength="5000" value={form.description} onChange={(event) => update('description', event.target.value)} /></label>
          {error && <p className="form-error admin-form-wide" role="alert">{error}</p>}
          <div className="admin-form-actions admin-form-wide">
            <button className="button button-secondary" type="button" onClick={onCancel} disabled={saving}>Cancel</button>
            <button className="button" type="submit" disabled={saving}>{saving ? 'Saving…' : initialEvent ? 'Save changes' : 'Create event'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}