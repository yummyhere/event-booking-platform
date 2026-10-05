import { validationResult } from 'express-validator';
import { all, get, run, transaction } from '../config/db.js';
import { httpError } from '../middleware/errors.js';

function validatedEvent(request) {
  const errors = validationResult(request);
  if (!errors.isEmpty()) throw httpError(400, errors.array()[0].msg);
  const { title, description = '', category, location, event_date, price, total_seats, image_url = null } = request.body;
  return {
    title: title.trim(), description: description.trim(), category: category.trim(), location: location.trim(),
    eventDate: event_date, price: Number(price), totalSeats: Number(total_seats), imageUrl: image_url || null
  };
}

export async function createEvent(request, response, next) {
  try {
    const event = validatedEvent(request);
    const result = await run(`INSERT INTO events
      (title, description, category, location, event_date, price, total_seats, available_seats, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      event.title, event.description, event.category, event.location, event.eventDate,
      event.price, event.totalSeats, event.totalSeats, event.imageUrl
    ]);
    const created = await get('SELECT * FROM events WHERE id = ?', [result.lastID]);
    response.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
}

export async function updateEvent(request, response, next) {
  try {
    const event = validatedEvent(request);
    const updated = await transaction(async ({ get: getInTransaction, run: runInTransaction }) => {
      const existing = await getInTransaction('SELECT id FROM events WHERE id = ?', [request.params.id]);
      if (!existing) throw httpError(404, 'Event not found.');
      const booked = await getInTransaction(`SELECT COALESCE(SUM(tickets), 0) AS seats
        FROM bookings WHERE event_id = ? AND status = 'confirmed'`, [request.params.id]);
      if (event.totalSeats < booked.seats) {
        throw httpError(409, `Total seats cannot be below the ${booked.seats} confirmed seats already booked.`);
      }
      await runInTransaction(`UPDATE events SET title = ?, description = ?, category = ?, location = ?,
        event_date = ?, price = ?, total_seats = ?, available_seats = ?, image_url = ? WHERE id = ?`, [
        event.title, event.description, event.category, event.location, event.eventDate,
        event.price, event.totalSeats, event.totalSeats - booked.seats, event.imageUrl, request.params.id
      ]);
      return getInTransaction('SELECT * FROM events WHERE id = ?', [request.params.id]);
    });
    response.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

export async function deleteEvent(request, response, next) {
  try {
    const errors = validationResult(request);
    if (!errors.isEmpty()) throw httpError(400, errors.array()[0].msg);
    const deleted = await transaction(async ({ get: getInTransaction, run: runInTransaction }) => {
      const event = await getInTransaction('SELECT id FROM events WHERE id = ?', [request.params.id]);
      if (!event) throw httpError(404, 'Event not found.');
      await runInTransaction('DELETE FROM events WHERE id = ?', [request.params.id]);
      return event;
    });
    response.json({ success: true, message: 'Event and related bookings deleted successfully.', data: deleted });
  } catch (error) {
    next(error);
  }
}

export async function listAllBookings(request, response, next) {
  try {
    const bookings = await all(`SELECT b.id, b.user_id, u.name AS user_name, u.email AS user_email,
      b.event_id, e.title AS event_title, b.tickets, b.total_price, b.status, b.booked_at
      FROM bookings b JOIN users u ON u.id = b.user_id JOIN events e ON e.id = b.event_id
      ORDER BY datetime(b.booked_at) DESC, b.id DESC`);
    response.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
}

export async function adminStats(request, response, next) {
  try {
    const stats = await get(`SELECT
      (SELECT COUNT(*) FROM events) AS total_events,
      (SELECT COUNT(*) FROM bookings) AS total_bookings,
      (SELECT COUNT(*) FROM users) AS total_users,
      (SELECT COALESCE(SUM(total_price), 0) FROM bookings WHERE status = 'confirmed') AS total_revenue`);
    response.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}