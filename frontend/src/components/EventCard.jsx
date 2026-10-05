const dateFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const fallbackImage = 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=85';

export default function EventCard({ event, onBook }) {
  const soldOut = event.available_seats === 0;
  return (
    <article className="event-card">
      <div className="event-image-wrap">
        <img className="event-image" src={event.image_url || fallbackImage} alt="" loading="lazy" onError={(imageEvent) => { imageEvent.currentTarget.onerror = null; imageEvent.currentTarget.src = fallbackImage; }} />
        <span className="category-tag">{event.category}</span>
        {soldOut && <span className="sold-out-tag">Sold out</span>}
      </div>
      <div className="event-card-content">
        <div className="event-date-line">{dateFormatter.format(new Date(event.event_date))}<span>·</span>{new Date(event.event_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
        <h2>{event.title}</h2>
        <p className="event-location"><span aria-hidden="true">↗</span> {event.location}</p>
        <p className="event-description">{event.description}</p>
        <div className="event-card-footer">
          <div className="event-price">{Number(event.price) === 0 ? 'Free' : `$${Number(event.price).toFixed(2)}`}<span> / person</span></div>
          <span className={soldOut ? 'seats-left sold-out-text' : 'seats-left'}>{soldOut ? 'Fully booked' : `${event.available_seats} spots left`}</span>
        </div>
        <button className="button event-book-button" onClick={() => onBook(event)} disabled={soldOut}>
          {soldOut ? 'Sold out' : 'Book a spot'} <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  );
}