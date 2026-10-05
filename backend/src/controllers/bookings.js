import { validationResult } from 'express-validator';
import { all, get, run, transaction } from '../config/db.js';
import { httpError } from '../middleware/errors.js';

export async function createBooking(request, response, next) {
  try {
    const errors = validationResult(request);
    if (!errors.isEmpty()) throw httpError(400, errors.array()[0].msg);
    // Lock inventory, decrement seats, and insert the booking as one indivisible operation.
    const booking = await transaction(async ({ get: getInTransaction, run: runInTransaction }) => {
      const event = await getInTransaction('SELECT id, event_date, price, available_seats FROM events WHERE id = ?', [
        Number(request.body.event_id)
      ]);
      if (!event) throw httpError(404, 'Event not found.');
      if (new Date(event.event_date).getTime() < Date.now()) throw httpError(409, 'This event has already taken place.');
      const tickets = Number(request.body.tickets);
      if (event.available_seats < tickets) throw httpError(409, 'There are not enough seats available.');

      const seatUpdate = await runInTransaction(
        'UPDATE events SET available_seats = available_seats - ? WHERE id = ? AND available_seats >= ?',
        [tickets, event.id, tickets]
      );
      if (seatUpdate.changes !== 1) throw httpError(409, 'There are not enough seats available.');
      const totalPrice = Number((event.price * tickets).toFixed(2));
      const result = await runInTransaction(
        "INSERT INTO bookings (user_id, event_id, tickets, total_price, status) VALUES (?, ?, ?, ?, 'confirmed')",
        [request.user.id, event.id, tickets, totalPrice]
      );
      return getInTransaction('SELECT * FROM bookings WHERE id = ?', [result.lastID]);
    });
    response.status(201).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
}

export async function listUserBookings(request, response, next) {
  try {
    const bookings = await all(`
      SELECT b.id, b.user_id, b.event_id, b.tickets, b.total_price, b.status, b.booked_at,
             e.title, e.event_date, e.location, e.price, e.image_url,
             CASE WHEN datetime(e.event_date) >= datetime('now') THEN 1 ELSE 0 END AS is_upcoming
      FROM bookings b
      JOIN events e ON e.id = b.event_id
      WHERE b.user_id = ?
      ORDER BY datetime(b.booked_at) DESC`, [request.user.id]);
    response.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
}

export async function cancelBooking(request, response, next) {
  try {
    const cancelled = await transaction(async ({ get: getInTransaction, run: runInTransaction }) => {
      const booking = await getInTransaction(
        "SELECT b.*, e.event_date FROM bookings b JOIN events e ON e.id = b.event_id WHERE b.id = ? AND b.user_id = ?",
        [request.params.id, request.user.id]
      );
      if (!booking) throw httpError(404, 'Booking not found.');
      if (booking.status === 'cancelled') throw httpError(409, 'This booking is already cancelled.');
      if (new Date(booking.event_date).getTime() < Date.now()) throw httpError(409, 'Past bookings cannot be cancelled.');
      await runInTransaction("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [booking.id]);
      await runInTransaction('UPDATE events SET available_seats = available_seats + ? WHERE id = ?', [booking.tickets, booking.event_id]);
      return { id: booking.id, status: 'cancelled' };
    });
    response.json({ success: true, data: cancelled });
  } catch (error) {
    next(error);
  }
}