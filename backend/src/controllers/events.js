import { all, get } from '../config/db.js';

export async function listEvents(request, response, next) {
  try {
    const { search = '', category = '', date = '', upcoming = '' } = request.query;
    const conditions = [];
    const params = [];
    if (search.trim()) {
      conditions.push('(title LIKE ? OR description LIKE ? OR location LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }
    if (category.trim()) {
      conditions.push('category = ?');
      params.push(category.trim());
    }
    if (date) {
      conditions.push("date(event_date) = date(?)");
      params.push(date);
    }
    if (upcoming === 'true') {
      conditions.push("datetime(event_date) >= datetime('now')");
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const events = await all(`SELECT * FROM events ${where} ORDER BY event_date ASC`, params);
    response.json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
}

export async function getEvent(request, response, next) {
  try {
    const event = await get('SELECT * FROM events WHERE id = ?', [request.params.id]);
    if (!event) return response.status(404).json({ success: false, message: 'Event not found.' });
    response.json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
}